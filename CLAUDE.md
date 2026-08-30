# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Unstitched fabric storefront (men's + women's) with WhatsApp-based ordering
(no cart/checkout — the "buy button" opens a pre-filled WhatsApp chat) and a
self-managed admin panel for products, categories, and sales. There is no
customer login, cart, or order system.

## Structure

```
backend/     FastAPI + Postgres API (products, categories, admin auth, image upload)
frontend/    React 19 + Vite + TS + Tailwind v4 — storefront and admin panel in one app
docs/        Planning docs: site-map.md (architecture/DB schema reasoning), todo.md (project checklist)
```

## Commands

### Backend (`backend/`)

```bash
python3 -m venv venv && source venv/bin/activate   # venv/ already exists in this repo on Windows
pip install -r requirements.txt

alembic upgrade head              # apply migrations (real schema mechanism, not create_all)
alembic revision --autogenerate -m "description"   # after changing app/models.py — review the generated file before applying
python -m scripts.create_admin    # create admin login from .env INITIAL_ADMIN_USERNAME/PASSWORD, idempotent

uvicorn app.main:app --reload     # http://localhost:8000, docs at /docs
```

No test suite and no linter/formatter config exist in this repo yet — don't invent commands for them.

### Frontend (`frontend/`)

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build -> frontend/dist/
npm run preview
npm run og        # regenerate public/og-image.jpg (only after editing scripts/og-card.html)
```

No test suite or ESLint config exists here either; `npm run build`'s `tsc -b` is the only automated check currently available — run it after TS changes. CI (`.github/workflows/ci.yml`) runs that build plus, on the backend, `alembic upgrade head` + `alembic check` + an app import against a real Postgres service container.

## Architecture

**One React app, two independent route trees**, merged in `App.tsx`:
`storefrontRoutes` (`frontend/src/storefront/`) and `adminRoutes`
(`frontend/src/admin/`). Each side has its own `api.ts`, `types.ts`, and CSS
file — they don't share components. The storefront is public/read-only
against the API; the admin side authenticates and does CRUD.

**Backend is a thin CRUD API**, not a service layer — routers in
`backend/app/routers/{products,categories,admin}.py` talk to SQLAlchemy
models directly. There's no repository/service abstraction to look for.

- `products.py`, `categories.py` — public GETs (no auth) plus admin
  POST/PUT/DELETE (`Depends(get_current_admin)`) in the same router file,
  split by a `# ---- Public ----` / `# ---- Admin (protected) ----` comment.
- `admin.py` — login (rate-limited) and Cloudinary image upload only.

**Auth**: JWT bearer tokens (`app/auth.py`), `python-jose` + `passlib[bcrypt]`.
`get_current_admin` is the dependency gating every write endpoint. Login
timing is deliberately constant — `authenticate_admin` always runs
`verify_password` against a dummy hash when the username doesn't exist, to
avoid leaking valid usernames via response timing. Login attempts are
IP-rate-limited in-memory (`app/rate_limit.py`, 5 per 15 min) — this is a
single-process app, so no Redis/shared store is used; that's intentional,
not a gap to "fix".

**Config** (`app/config.py`, pydantic-settings from `.env`): refuses to
start if `JWT_SECRET_KEY` is a known placeholder or under 32 chars — this
is deliberate fail-fast behavior, not a bug, if you hit it in local setup
just generate a real secret.

**Sale expiry** is virtual, not written back: `on_sale`/`sale_price`/
`sale_ends_at` live on `Product`, but an expired sale is computed at read
time (`apply_sale_expiry` in Python for single-row reads,
`_effective_on_sale_filter` as a SQL condition for list queries) rather than
updated in the DB. The two must stay logically in sync if that rule ever
changes — they're deliberately duplicated, not accidentally.

**Categories are data, not code**: gender (`men`/`women`) + category name +
`sort_order` live in the `categories` table, admin-editable. Don't add
hardcoded category routes/switch statements in the frontend — category
pages are data-driven off `GET /categories`.

**Image uploads**: admin uploads go through `POST /admin/upload-image`,
which verifies the real decoded image format via Pillow (not just the
client-supplied `Content-Type`) before forwarding to Cloudinary, capped at
8MB, JPEG/PNG/WEBP only.

**Migrations**: Alembic is the source of truth for schema (`backend/alembic/versions/`).
`Base.metadata.create_all` still runs on app startup in `main.py` as a
harmless fallback (only creates missing tables, never alters existing
ones) — don't rely on it for real schema changes, always generate a migration.

**SEO / link previews** split across two mechanisms that must not be
confused:

- `frontend/src/usePageMeta.ts` (at `src/`, not under either route tree,
  because both use it) sets `document.title`, the meta description and the
  canonical link at *runtime*. This serves the browser tab and Google, which
  renders JS. Every storefront page calls it; admin pages call it with
  `noindex: true`.
- The Open Graph / Twitter tags in the built `index.html` are injected at
  *build time* by the `siteMeta` plugin in `vite.config.ts`. WhatsApp and
  Facebook don't run JS, so those static tags are what every shared link
  shows, regardless of URL — per-product previews would need prerendering.
  Don't "fix" this by setting `og:*` from `usePageMeta`; crawlers never see it.

`VITE_SITE_URL` is the single source of the public origin — it feeds those
absolute OG URLs plus the generated `robots.txt` and `sitemap.xml`, which is
why the latter two are emitted by the plugin instead of living in `public/`.
Note that `%PLACEHOLDER%` substitution inside an `href`/`content` attribute in
`index.html` fails the build (Vite runs `decodeURI` over those while parsing),
hence tag injection rather than string replacement.

**Static hosting config**: `frontend/public/.htaccess` is copied verbatim into
`dist/` by Vite. Its rewrite rule is load-bearing — without it, refreshing any
inner route or opening a shared `/product/12` link returns the host's own 404,
because only `index.html` physically exists.

**WhatsApp ordering**: `frontend/src/storefront/config.ts` holds the single
`WHATSAPP_NUMBER` constant (previously duplicated across files — keep it
that way). `whatsappLink()` in `storefront/api.ts` builds the pre-filled
message deep link; there is no order/cart backend involved at all.

## Deployment

- Frontend: static build (`frontend/dist/`) on Hostinger Business Web
  Hosting (sub-hosting under arcoliv.com). Build with `VITE_SITE_URL` set to
  the real origin, and upload the **whole** `dist/` including the dotfile
  `.htaccess` — some FTP clients hide it by default, and without it every
  deep link 404s.
- Backend + Postgres: Python-capable host, currently targeting Koyeb's free
  tier, git-push deploy from `backend/`.
- Set real `CORS_ORIGINS` (comma-separated) to the actual frontend domain(s) in production — the default is `localhost:5173` only.
