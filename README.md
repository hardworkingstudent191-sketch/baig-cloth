# Baig Cloth

Unstitched fabric storefront with WhatsApp ordering, built for both men's
and women's collections, with a self-managed admin panel for products,
categories, and sales.

## Structure

```
backend/     FastAPI + Postgres API (products, categories, admin auth, image upload)
frontend/    React 19 + Vite + TS + Tailwind v4 — storefront and admin panel in one app
docs/        Planning docs: full architecture/site map, project to-do list, placeholder images
```

## Run it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: DATABASE_URL, JWT_SECRET_KEY, Cloudinary keys, INITIAL_ADMIN_USERNAME/PASSWORD

python -m scripts.create_admin   # creates your first admin login
uvicorn app.main:app --reload    # runs on http://localhost:8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_URL=http://localhost:8000 (already the default)

npm run dev   # runs on http://localhost:5173
```

Storefront: http://localhost:5173
Admin panel: http://localhost:5173/admin/login

### Before going live

- Replace the `WHATSAPP_NUMBER` placeholder in `frontend/src/storefront/StorefrontLayout.tsx`
  and `ProductPage.tsx` with your real number.
- Swap placeholder product images for real photography (see `docs/todo.md` Phase 4).
- Review `docs/site-map.md` for the full architecture and feasibility notes,
  and `docs/todo.md` for the complete start-to-finish checklist.

## Deploying

- **Frontend**: static build (`npm run build` → `frontend/dist/`), hosted on
  Hostinger Business Web Hosting (sub-hosting under arcoliv.com).
- **Backend + Postgres**: needs a Python-capable host — currently targeting
  Koyeb's free tier (git-push deploy from this repo's `backend/` folder).

See `docs/site-map.md` for the full reasoning behind this split.
