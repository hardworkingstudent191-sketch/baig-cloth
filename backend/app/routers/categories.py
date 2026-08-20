from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Category, Gender
from app.schemas import CategoryOut, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


# ---- Public ----

@router.get("", response_model=list[CategoryOut])
def list_categories(gender: Optional[Gender] = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if gender is not None:
        query = query.filter(Category.gender == gender)
    return query.order_by(Category.sort_order).all()


# ---- Admin (protected) ----

@router.post("", response_model=CategoryOut, dependencies=[Depends(get_current_admin)])
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut, dependencies=[Depends(get_current_admin)])
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204, dependencies=[Depends(get_current_admin)])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    has_products = len(category.products) > 0
    if has_products:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a category that still has products. Reassign or delete them first.",
        )

    db.delete(category)
    db.commit()
