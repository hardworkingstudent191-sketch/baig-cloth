import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Numeric,
    ForeignKey,
    DateTime,
    Enum,
    ARRAY,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Gender(str, enum.Enum):
    men = "men"
    women = "women"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(Text, default="")

    price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=True)
    on_sale = Column(Boolean, default=False, nullable=False)
    sale_ends_at = Column(DateTime(timezone=True), nullable=True)

    in_stock = Column(Boolean, default=True, nullable=False)
    image_urls = Column(ARRAY(String), default=list)
    featured = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category", back_populates="products")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
