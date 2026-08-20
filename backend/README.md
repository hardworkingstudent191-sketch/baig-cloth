# Baig Cloth API

FastAPI backend for the Baig Cloth admin panel + storefront.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET_KEY, Cloudinary keys,
# INITIAL_ADMIN_USERNAME/PASSWORD, CORS_ORIGINS
```

## Create the database

Create a Postgres database matching your `DATABASE_URL` (e.g. `baigcloth`).
Tables are auto-created on first run via `Base.metadata.create_all` — fine
for now, but once the schema stabilizes, switch to Alembic migrations
(already in requirements.txt, not yet wired up).

## Create your admin login

```bash
python -m scripts.create_admin
```

Reads `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD` from `.env`.
Safe to re-run — skips if that username already exists.

## Run locally

```bash
uvicorn app.main:app --reload
```

API docs (interactive): http://localhost:8000/docs

## Endpoints

**Public**
- `GET /products` — filters: `gender`, `category_id`, `on_sale`, `featured`
- `GET /products/{id}`
- `GET /categories` — filter: `gender`

**Admin (Bearer token from `/admin/login`)**
- `POST /admin/login` — body: `{"username": "...", "password": "..."}`
- `POST /admin/upload-image` — multipart file upload, returns Cloudinary URL
- `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`
- `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`

Use the returned `access_token` as `Authorization: Bearer <token>` on
admin-only requests.

## Deploying to the VPS

1. Install Python 3.11+, Postgres (or point at a managed Postgres instance)
2. Clone the repo, follow Setup above
3. Run behind a process manager (systemd or supervisor) — don't run
   `uvicorn --reload` in production
4. Put Nginx or CloudPanel's built-in reverse proxy in front of it with SSL
5. Set real `CORS_ORIGINS` to your actual frontend domain(s)
