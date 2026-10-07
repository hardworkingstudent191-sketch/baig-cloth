# WordPress backend — status (updated 2026-10-07)

The backend works and is verified against a live WordPress. What remains is
deployment-side and device QA — see "Not done" below.

## Done and verified

- **Plugin complete** (`plugins/baig-cloth-headless/`): product CPT + category
  taxonomy (gender / sort order term meta), details + gallery metaboxes,
  public REST API at `/wp-json/baig/v1`, CORS, idempotent importer (admin
  page + `wp baig import`), settings page.
- **Full API parity with FastAPI** — `migration/parity_check.py` reports
  FULL PARITY across 6 categories + 46 products: every filter (gender,
  category_id, on_sale, featured, search), pagination windows, single
  reads, input-validation status codes (422s), and the 404 shape.
  Two deliberate, documented allowances: timestamps compare at whole-second
  precision (WordPress dates have no microseconds) and tie order inside a
  group of identical `created_at` is ignored (single-statement inserts have
  no defined order, even in FastAPI).
- **Browser-verified** (storefront at desktop + phone width against the
  WordPress API, and wp-admin): catalog renders with correct sale pricing;
  product list/category table/settings page/gallery widget work; a product
  published in wp-admin appears in the API with the exact contract shape,
  first in newest-first order.
- **Review findings fixed and tested live:** category-delete guard (blocks
  a category with products, still deletes an empty one); `search[]=x` and
  other array params now 422 instead of a fatal; price gate (a priceless
  publish becomes a draft with a warning and stays out of the public API);
  sale price >= price switches "On sale" off with a warning; plain-permalink
  warning on the settings page; Quick Edit/Bulk Edit category checkboxes
  disabled (a product must have exactly one category).
- **Frontend fixes this work needed (both in `frontend/vite.config.ts`,
  verified in real build output):** CSP `connect-src` uses the API URL's
  *origin* (a path like `/wp-json/baig/v1` would block every API call);
  CSP `img-src` includes the API origin (Media Library photos are served
  from the WordPress host and were silently blocked).

## Release packaging (done 2026-10-07)

`py -3.12 wordpress/scripts/package_release.py --api-url https://<cms>/wp-json/baig/v1 --site-url https://<domain>`
writes `wordpress/dist/` (gitignored): `baig-cloth-headless.zip` (upload in
WordPress → Plugins → Upload), `storefront/` (upload its contents to the
storefront's public_html), `catalog-export.json`, `RELEASE.txt`. Verified: a
fresh WordPress that installs ONLY the zip (no source folder), activates it,
imports the catalog and passes all 43 parity checks; the built storefront has
no dev URLs, a correct CSP/canonical/sitemap, and ships `.htaccess`.

## Second review pass (done 2026-10-07)

Three independent reviewers re-checked the plugin (PHP correctness, WP
gotchas + security) and the frontend integration; every claim was verified
against the code before acting. Fixed and live-tested: non-ASCII image URLs
(wp_slash), scheduled-publish gate bypass, category required to publish +
explicit blank dropdown default, protocol-relative image URLs, same-name
category slugs, Enter-in-URL-box submit, CORS origin normalization + Vary,
importer price validation; storefront request races, stale-id pruning, admin
routes off for WordPress, trailing-slash API URLs, and a production-build
guard against localhost/http API URLs. Known, accepted: returning visitors'
saved ids from the old Postgres database can map to different WordPress
products (the site was never launched, so there are no such visitors).

## Dev setup (offline-safe)

Run from **PowerShell, not Git Bash** (MSYS mangles the mount colon). CLI
3.1.56 and WordPress core are cached locally.

```
npx @wp-playground/cli@3.1.56 server --port 9400 --blueprint ./wordpress/dev/blueprint.json --mount ./wordpress/plugins/baig-cloth-headless:/wordpress/wp-content/plugins/baig-cloth-headless --mount ./wordpress/migration:/wordpress/wp-content/migration
```

- API: `http://127.0.0.1:9400/wp-json/baig/v1`. wp-admin login: user `admin`,
  password = the `wp user update` step in `dev/blueprint.json` (throwaway;
  the site is rebuilt on every boot).
- Auto-login is **off on purpose**: Playground answers cookie-less requests
  with a 302 lacking CORS headers, which blocks the storefront's cross-origin
  fetches (see `wordpress/README.md`).
- Parity check needs FastAPI on :8000 too (`backend/.venv/Scripts/python.exe
  -m uvicorn app.main:app --port 8000`), then
  `py -3.12 wordpress/migration/parity_check.py`.
- `frontend/.env.local` (untracked) points the dev storefront at :9400;
  delete it to go back to FastAPI.

## Not done

1. **Real Hostinger deploy** per `wordpress/README.md`: install WordPress on
   a subdomain, upload the plugin zip, Post-name permalinks, import
   `migration/catalog-export.json`, set storefront origin, build the
   frontend with `VITE_API_URL=https://<cms>/wp-json/baig/v1` and
   `VITE_SITE_URL`, upload `dist/`. Needs the owner's Hostinger access and
   final domain. Test the API against the *deployed* site afterwards
   (re-run `parity_check.py` with `--wp https://<cms>/wp-json/baig/v1`).
2. **Real-device QA** (iPhone + Android): the biggest untested risk.
3. **Content pass:** confirm all 46 products' photos/prices; have the
   policies copy reviewed (legal-adjacent, written in-house).
4. **Production hardening checklist:** strong WordPress admin password,
   auto-updates on, consider restricting CORS to the storefront origin,
   backups (Hostinger daily backups / a plugin).
5. Still-unverified review lenses from the interrupted automated review
   (usage limit): generic PHP-correctness and WP-gotcha sweeps. The live
   run, parity check and browser QA above cover the realistic failure
   modes; a final targeted re-review is optional.
6. Launch track: `docs/todo.md` phases 5-7 (Search Console sitemap,
   WhatsApp link-preview check, soft launch).
