# WordPress backend — work-in-progress status (saved 2026-10-04)

The plugin, migration tooling, and docs in this folder are **written but not
yet verified against a running WordPress**. Session was stopped and saved at
this point. Read this before continuing.

## Done

- Plugin complete (`plugins/baig-cloth-headless/`): CPT + taxonomy with
  gender/sort term meta, details + gallery metaboxes, REST API at
  `/wp-json/baig/v1` matching the FastAPI contract, CORS, idempotent
  importer (admin page + `wp baig import`), settings page.
- Catalog exported from Postgres: `migration/catalog-export.json`
  (6 categories, 46 products — all image URLs are repo-relative `/products/...`).
- Parity checker written: `migration/parity_check.py` (fires the same request
  matrix at both backends and diffs normalized JSON). **Never run yet.**
- Frontend fix shipped: `vite.config.ts` was putting the full API URL (path
  included) into CSP connect-src — with the WP URL every production API call
  would have been blocked. Now uses `new URL(...).origin`. `tsc -b` clean.
- `frontend/.env.local` (untracked) points dev at the Playground URL;
  delete it to go back to FastAPI.

## Not done — in order

1. **Fix the three confirmed review findings** (adversarially verified):
   - `includes/post-types.php` — deleting a category that still has products
     is allowed; its products then silently vanish from all listings
     (FastAPI returned 400 for this). Add a `pre_delete_term` guard that
     blocks deletion while products are assigned.
   - `includes/rest-api.php:~230` — `GET /products?search[]=x` (array param)
     reaches `mb_stripos()` and fatals → anonymous 500 on PHP 8. Reject
     non-string `search`/params with a 422, like the original API.
   - `includes/metabox.php` — no server-side price>0 gate: a product can
     reach publish with no `_bc_price` (e.g. Quick Edit after an autosaved
     draft — the nonce path skips the save handler entirely) and serves
     `"0.00"`. Block publish without a valid price.
   - Split verdict (judge disagreement, decide yourself): the settings page
     advertises `rest_url('baig/v1')` as VITE_API_URL, which on
     plain-permalink installs is a `?rest_route=` URL that breaks api.ts's
     `?`-joining. Cheapest fix: warn on that page when pretty permalinks
     are off (the README already requires them).
2. **Boot Playground and import** (first `npx` run needed two retries:
   one npm ECONNRESET, one Git Bash mangling the mount colon — run it from
   PowerShell):
   `npx @wp-playground/cli@latest server --port 9400 --blueprint ./wordpress/dev/blueprint.json --mount ./wordpress/plugins/baig-cloth-headless:/wordpress/wp-content/plugins/baig-cloth-headless --mount ./wordpress/migration:/wordpress/wp-content/migration`
   (from the repo root; wp-admin auto-login at http://127.0.0.1:9400/wp-admin/)
3. **Run the parity check** with FastAPI also up on :8000
   (`backend/.venv/Scripts/python.exe wordpress/migration/parity_check.py`)
   and fix every reported difference.
4. **Browser QA** of the storefront against the WP backend
   (frontend dev server picks up `.env.local`), including wp-admin
   product add/edit with media-library images.
5. Review-dimension caveat: the automated review's verify stage was cut
   short by a usage limit — `php-correctness`, `wp-gotchas` and
   `frontend-integration` finder output was never adversarially verified.
   Raw findings live in the session's workflow journal; cheapest recovery
   is re-reviewing those three lenses once, or just relying on steps 2–4
   (live boot + parity + QA), which would catch the same classes of bug.
6. Then the normal launch track: real-device QA, content pass, Hostinger
   deploy per `README.md`, launch checklist (`docs/todo.md` phases 5–7).
