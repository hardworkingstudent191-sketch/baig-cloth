# WordPress backend for Baig Cloth

A headless WordPress backend that serves the existing React storefront —
an alternative to the FastAPI backend in `../backend/`, chosen because it
runs on ordinary PHP shared hosting (Hostinger) with a familiar admin, no
Python host needed.

**The storefront does not change.** The plugin exposes the exact same JSON
contract the FastAPI backend serves (same routes, same field names, prices
as strings, sale-expiry behaviour, newest-first order). Switching backends
is one frontend env change:

```
VITE_API_URL=https://cms.yourdomain.com/wp-json/baig/v1
```

## What's here

```
plugins/baig-cloth-headless/   the whole backend, as one WordPress plugin
migration/
  export_from_postgres.py      dumps the FastAPI/Postgres catalog to JSON
  catalog-export.json          the exported live catalog (6 categories, 46 products)
  parity_check.py              fires the same requests at both backends and diffs them
dev/blueprint.json             local WordPress Playground config for development
```

## The plugin

- **Products** — a custom post type. Title = name, editor = description,
  plus a details metabox (price, sale price with the same validation rules
  as the original API, sale end date in the site's timezone, in-stock,
  featured) and a gallery metabox (media library picker, add-by-URL,
  reorder, remove; first image is the card image).
- **Categories** — a taxonomy with gender (men/women) and sort order on
  each term. One category per product, enforced by a dropdown.
- **REST API** at `/wp-json/baig/v1`: `GET /products` (filters: gender,
  category_id, on_sale, featured, search, limit, offset),
  `GET /products/{id}`, `GET /categories?gender=`. Read-only and public —
  writes happen in wp-admin only.
- **Importer** — Products → Import catalog (upload
  `migration/catalog-export.json`), or `wp baig import <file>` under
  WP-CLI. Idempotent: re-running skips everything already imported.
- **Settings** — Products → Storefront settings: CORS origins and the
  storefront origin (used to preview relative `/products/...` image paths
  inside wp-admin).

### Images

Product images are stored as a plain ordered list of URLs, which is exactly
what the API returns:

- The 46 migrated products keep their repo-relative paths
  (`/products/wash-n-wear/ash-grey.jpg`) — those files ship with the
  frontend build and get its WebP `srcSet` treatment, so nothing about
  today's images changes.
- New products added in wp-admin use the Media Library; their absolute
  WordPress URLs pass through the frontend untouched.

## Local development

Requires only Node (uses WordPress Playground — PHP runs in WASM):

```bash
cd baig-cloth
npx @wp-playground/cli@latest server --port 9400 \
  --blueprint ./wordpress/dev/blueprint.json \
  --mount ./wordpress/plugins/baig-cloth-headless:/wordpress/wp-content/plugins/baig-cloth-headless \
  --mount ./wordpress/migration:/wordpress/wp-content/migration
```

That boots WordPress, activates the plugin, sets Asia/Karachi, and imports
the catalog. wp-admin: `http://127.0.0.1:9400/wp-admin/` (auto-logged-in).
API: `http://127.0.0.1:9400/wp-json/baig/v1/products`.

Run the storefront against it:

```bash
cd frontend
VITE_API_URL=http://127.0.0.1:9400/wp-json/baig/v1 npm run dev
```

Parity check (with the FastAPI backend also running on :8000):

```bash
backend/.venv/Scripts/python.exe wordpress/migration/parity_check.py
```

## Deploying to Hostinger (production)

1. **Install WordPress** on the hosting (hPanel → Auto Installer), ideally
   on a subdomain like `cms.yourdomain.com`. Keep the main domain for the
   storefront build.
2. **Upload the plugin**: zip `plugins/baig-cloth-headless/` and install it
   via Plugins → Add New → Upload, then activate.
3. **Permalinks**: Settings → Permalinks → "Post name" (the REST API needs
   pretty permalinks). Save.
4. **Import**: Products → Import catalog → upload
   `migration/catalog-export.json`.
5. **Settings**: Products → Storefront settings — set the storefront origin
   (e.g. `https://yourdomain.com`); optionally restrict CORS to it.
6. **Frontend build**: in `frontend/.env` set
   `VITE_API_URL=https://cms.yourdomain.com/wp-json/baig/v1` and
   `VITE_SITE_URL=https://yourdomain.com`, run `npm run build`, upload
   `dist/` to the main domain's `public_html` (the shipped `.htaccess`
   handles SPA routing).
7. **Harden WordPress** (standard practice): strong admin password, keep
   core/plugin auto-updates on, and a security plugin if desired. The
   storefront never authenticates against WordPress — wp-admin is the only
   login surface.

## Which backend is "the" backend?

Both are kept in the repo and both pass the same contract (see
`migration/parity_check.py`):

- `backend/` — FastAPI + Postgres. Needs a Python host (Railway ~$5/mo).
  Has the custom React admin at `/admin`.
- `wordpress/` — this plugin. Runs on PHP shared hosting. Admin is
  wp-admin; the React `/admin` routes are not used with this backend.

Pick per deployment with `VITE_API_URL`. Nothing else in the frontend
changes.
