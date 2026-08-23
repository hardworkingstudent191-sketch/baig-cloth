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

Create a Postgres database matching your `DATABASE_URL` (e.g. `baigcloth`),
then apply the schema with Alembic:

```bash
alembic upgrade head
```

This creates all tables and indexes. `Base.metadata.create_all` still runs
as a fallback on app startup too (harmless — it only ever creates missing
tables, never touches ones that already exist), but Alembic is now the real
mechanism for schema changes: whenever a model changes, run
`alembic revision --autogenerate -m "description"` to generate a migration,
review the generated file, then `alembic upgrade head` to apply it.

**Already had this app running before this migration system existed?**
Your database already has the tables (`create_all` made them), just not the
indexes added in the "Initial schema" migration. One-time fix:

```bash
alembic stamp head
```

Then add the missing indexes directly:

```sql
CREATE INDEX IF NOT EXISTS ix_categories_gender ON categories (gender);
CREATE INDEX IF NOT EXISTS ix_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS ix_products_on_sale ON products (on_sale);
CREATE INDEX IF NOT EXISTS ix_products_featured ON products (featured);
```

(`psql -d baigcloth -c "..."`, or paste them into psql interactively.) This
doesn't touch your existing products/categories data — it only adds
indexes. After this, `alembic current` should show `fa8a51c185f5 (head)`,
and any future migrations apply normally with `alembic upgrade head`.

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
