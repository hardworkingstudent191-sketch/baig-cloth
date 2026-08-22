from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models import Gender


# ---- Category ----

class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    gender: Gender
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    gender: Optional[Gender] = None
    sort_order: Optional[int] = None


class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---- Product ----

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category_id: int
    description: str = Field(default="", max_length=4000)
    price: Decimal = Field(gt=0)
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
    on_sale: bool = False
    sale_ends_at: Optional[datetime] = None
    in_stock: bool = True
    image_urls: list[str] = []
    featured: bool = False

    @model_validator(mode="after")
    def check_sale_pricing(self):
        if self.on_sale:
            if self.sale_price is None:
                raise ValueError("sale_price is required when on_sale is true")
            if self.sale_price >= self.price:
                raise ValueError("sale_price must be less than price")
        return self


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category_id: Optional[int] = None
    description: Optional[str] = Field(default=None, max_length=4000)
    price: Optional[Decimal] = Field(default=None, gt=0)
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
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
