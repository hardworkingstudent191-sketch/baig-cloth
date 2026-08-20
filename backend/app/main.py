from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import products, categories, admin

# Creates tables if they don't exist yet. For real schema changes going
# forward, use Alembic migrations instead of relying on this.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Baig Cloth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(categories.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "baig-cloth-api"}
