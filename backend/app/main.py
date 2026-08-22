import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.routers import products, categories, admin

logger = logging.getLogger("baig_cloth")

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches anything that isn't already an HTTPException (e.g. a bad
    foreign key, a downstream API failure) so the API always returns clean
    JSON instead of leaking a raw traceback or plain-text 500 to the client."""
    if isinstance(exc, HTTPException):
        raise exc
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.get("/")
def health_check():
    return {"status": "ok", "service": "baig-cloth-api"}
