from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Product, Category, Gender, AdminUser
from app.schemas import ProductOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


# ---- Public ----

@router.get("", response_model=list[ProductOut])
def list_products(
    gender: Optional[Gender] = None,
    category_id: Optional[int] = None,
    on_sale: Optional[bool] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).join(Category)

    if gender is not None:
        query = query.filter(Category.gender == gender)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if on_sale is not None:
        query = query.filter(Product.on_sale == on_sale)
    if featured is not None:
        query = query.filter(Product.featured == featured)

    return query.order_by(Product.created_at.desc()).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


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

    for field, value in payload.model_dump(exclude_unset=True).items():
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
