from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models import Gender


# ---- Category ----

class CategoryBase(BaseModel):
    name: str
    gender: Gender
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    sort_order: Optional[int] = None


class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---- Product ----

class ProductBase(BaseModel):
    name: str
    category_id: int
    description: str = ""
    price: Decimal
    sale_price: Optional[Decimal] = None
    on_sale: bool = False
    sale_ends_at: Optional[datetime] = None
    in_stock: bool = True
    image_urls: list[str] = []
    featured: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    on_sale: Optional[bool] = None
    sale_ends_at: Optional[datetime] = None
    in_stock: Optional[bool] = None
    image_urls: Optional[list[str]] = None
    featured: Optional[bool] = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Admin / Auth ----

class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ImageUploadOut(BaseModel):
    url: str
