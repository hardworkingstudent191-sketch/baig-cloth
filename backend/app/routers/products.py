from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Product, Category, Gender, AdminUser
from app.schemas import ProductOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def apply_sale_expiry(product: Product) -> Product:
    """A sale that has passed its sale_ends_at is no longer "on sale" from the
    public API's point of view, even if the admin hasn't manually toggled the
    on_sale flag off yet. This adjusts the in-memory object only — it never
    writes the correction back to the database, so the admin's original
    on_sale/sale_price stay intact if they later push the end date back."""
    if product.on_sale and product.sale_ends_at is not None:
        if product.sale_ends_at < datetime.now(timezone.utc):
            product.on_sale = False
    return product


def _effective_on_sale_filter(want_on_sale: bool):
    """Same "is it really still on sale" logic as apply_sale_expiry, but as a
    SQL condition instead of a Python check — so filtering by on_sale can
    happen in the database instead of pulling every matching row into memory
    first. Kept in sync with apply_sale_expiry deliberately; if that logic
    ever changes, this needs to change with it."""
    now = datetime.now(timezone.utc)
    still_active = or_(Product.sale_ends_at.is_(None), Product.sale_ends_at > now)
    expired = and_(Product.sale_ends_at.isnot(None), Product.sale_ends_at <= now)

    if want_on_sale:
        return and_(Product.on_sale.is_(True), still_active)
    return or_(Product.on_sale.is_(False), and_(Product.on_sale.is_(True), expired))


# ---- Public ----

@router.get("", response_model=list[ProductOut])
def list_products(
    gender: Optional[Gender] = None,
    category_id: Optional[int] = None,
    on_sale: Optional[bool] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Product).join(Category)

    if gender is not None:
        query = query.filter(Category.gender == gender)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if featured is not None:
        query = query.filter(Product.featured == featured)
    if on_sale is not None:
        query = query.filter(_effective_on_sale_filter(on_sale))

    query = query.order_by(Product.created_at.desc()).offset(offset).limit(limit)
    return [apply_sale_expiry(p) for p in query.all()]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return apply_sale_expiry(product)


# ---- Admin (protected) ----

@router.post("", response_model=ProductOut, dependencies=[Depends(get_current_admin)])
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="category_id does not exist")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(get_current_admin)])
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    changes = payload.model_dump(exclude_unset=True)

    new_category_id = changes.get("category_id", product.category_id)
    if new_category_id != product.category_id:
        category = db.query(Category).filter(Category.id == new_category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="category_id does not exist")

    # Validate the sale price relationship against the FINAL merged state,
    # not just whichever fields happen to be in this particular partial
    # update — otherwise e.g. toggling on_sale=true without also resending
    # sale_price would silently save an invalid combination.
    effective_on_sale = changes.get("on_sale", product.on_sale)
    effective_price = changes.get("price", product.price)
    effective_sale_price = changes.get("sale_price", product.sale_price)
    if effective_on_sale:
        if effective_sale_price is None:
            raise HTTPException(status_code=400, detail="sale_price is required when on_sale is true")
        if effective_sale_price >= effective_price:
            raise HTTPException(status_code=400, detail="sale_price must be less than price")

    for field, value in changes.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(get_current_admin)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
