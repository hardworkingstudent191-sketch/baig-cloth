# Baig Cloth — Full Project To-Do List

Status legend: `[x]` done and in the repo · `[ ]` still open · `[~]` done
differently than originally planned (see note).

The build is feature-complete. What's left is almost entirely **deployment,
content and QA** — decisions and actions that need the real host, the real
domain, and real devices.

## Phase 0 — Decisions & Cleanup (do first)
- [ ] Check arcoliv.com's Hostinger plan type (shared/cloud vs VPS) — Python only runs on VPS
- [ ] If VPS: confirm tier is enough for frontend + FastAPI + Postgres (KVM 2 minimum recommended)
- [ ] Confirm whether that server is yours to use or Arco Liv's client infrastructure — ask before deploying an unrelated app on it
- [ ] Decide final hosting path: Hostinger VPS vs Railway Hobby ($5/mo) vs other
- [ ] Delete stale duplicate Railway service `baig-cloth-web` (id `d756923e-7ddd-4802-8982-9a6151752959`)
- [x] Lock in: custom FastAPI admin panel (not headless CMS) — confirmed direction

## Phase 1 — Backend Foundation
- [x] Set up Postgres database (categories, products, admin_users tables) — `backend/app/models.py`
- [x] Scaffold FastAPI project — `backend/app/`
- [x] Build JWT auth for admin login — `app/auth.py`, constant-time login, IP rate limiting
- [x] Build `GET /products` (filters: gender, category, on_sale, featured, search)
- [x] Build `GET /products/{id}`
- [x] Build `GET /categories`
- [x] Build admin CRUD: `POST/PUT/DELETE /products`
- [x] Build admin CRUD: `POST/PUT/DELETE /categories` (including reorder)
- [x] Build `POST /admin/upload-image` → Cloudinary (real format verified via Pillow, 8MB cap)
- [ ] Test all endpoints against the *deployed* API once hosting is settled (local testing done)

## Phase 2 — Admin Panel (Frontend)
- [x] `/admin/login` page
- [x] `/admin` dashboard — product list + quick stats
- [x] Add product form (name, category, price, sale price, description, image upload, in-stock toggle)
- [x] Edit/delete product from list
- [x] Category manager — add/rename/delete/reorder per gender
- [x] Sale toggle + optional sale end-date field on product form
- [x] Confirm image upload flow works end-to-end (admin → Cloudinary → URL saved to product)

## Phase 3 — Public Storefront
- [~] Homepage hero — built as a **video hero**, not a carousel: dark duotone
      "cutting mat" base with looping fabric footage over it, gated on
      `prefers-reduced-motion`, and designed to look complete with no video at
      all. A carousel would have meant maintaining rotating slide content the
      shop doesn't have yet.
- [x] Homepage: Men/Women category tiles (backed by real product photos)
- [x] Homepage: sale strip (conditional — only renders if on_sale products exist)
- [x] Homepage: featured/new arrivals row
- [x] Homepage: "how it works" trust section (Browse → WhatsApp → Confirm)
- [x] `/men` and `/women` category grid pages
- [x] `/men/:category` and `/women/:category` filtered pages (chips drive the URL, so filters are shareable)
- [x] `/product/:id` detail page (gallery, price, sale badge, description, WhatsApp CTA, real disabled state when out of stock)
- [x] `/sale` page — all on_sale products across genders
- [x] `/search` page
- [x] Floating/sticky WhatsApp button — pre-filled message with product name
- [x] `/policies` page — ordering, payment, delivery, exchanges & returns
- [x] `/about` page
- [x] Footer with policy links, contact, WhatsApp
- [x] 404 page + app-level error page for unhandled render errors
- [x] Scroll restoration (top on navigate, restore on back/forward)

## Phase 4 — Content & Assets
- [~] Product photography — 46 real products are live (27 wash-n-wear colors,
      19 women's suits) shot in the shop rather than to the original
      1000×1250 / 4:5 / <400KB spec. Fine for launch; worth a proper reshoot
      later if the catalog grows.
- [x] Write homepage hero headline/copy
- [x] Write policies content (terms, delivery, payment, returns)
- [ ] **Have someone review the policies copy** — it's legal-adjacent and currently written in-house
- [x] Populate initial product catalog via the admin panel
- [ ] Decide men's size options phrasing for the description field (per existing convention)

## Phase 5 — Infrastructure / DevOps
- [ ] Finalize hosting (per Phase 0 decision)
- [ ] Set up staging vs production environments (branch-based)
- [x] GitHub Actions CI — frontend `tsc -b && vite build`, backend migrations +
      `alembic check` (catches models drifting from migrations) + app import,
      against a real Postgres service. `.github/workflows/ci.yml`
- [x] `.htaccess` shipped in `frontend/public/` — SPA fallback (without it,
      refreshing `/men/lawn` or opening a shared `/product/12` link 404s on
      Apache/LiteSpeed), plus cache and compression headers
- [ ] Set all secrets/env vars properly (DB connection string, Cloudinary keys, JWT secret) — never hardcoded
- [ ] **Set `VITE_SITE_URL` in the production build env** — feeds the Open Graph
      URLs, robots.txt and sitemap.xml. The build prints a warning if it's missing.
- [ ] Set real `CORS_ORIGINS` on the API to the live frontend domain
- [ ] Connect custom domain + SSL
- [ ] Confirm Postgres backups are happening

## Phase 6 — QA & Testing
- [ ] Test on real mobile devices (not just browser resize) — iOS + Android if possible
- [ ] Test admin CRUD flows end-to-end against the deployed API
- [ ] Test WhatsApp CTA on both mobile and desktop
- [ ] Test sale badge/strikethrough logic, including `sale_ends_at` expiry
- [ ] Cross-browser check (Chrome, Safari at minimum)
- [ ] Check image load performance — the hero video is 3.2 MB and self-hosted;
      consider moving it to Cloudinary if the host's bandwidth is tight
- [x] Empty states covered (no products in a category, no active sales, no search results, API unreachable)
- [x] Route smoke test — every public route renders with the right title and
      indexing directive; verified against a production build

## Phase 7 — Launch
- [ ] Final review of policies page — make sure it's not a placeholder
- [ ] Verify the WhatsApp/Facebook link preview renders — paste the live URL
      into a WhatsApp chat and check the card. Re-scrape with Facebook's
      Sharing Debugger after any change to `og:image`.
- [ ] Soft launch to friends/family for real-world feedback
- [ ] Go live on custom domain
- [ ] Submit sitemap in Google Search Console
- [ ] Verify Meta Pixel / Conversions API tracking is firing correctly

## Phase 8 — Post-Launch (next milestones)
- [ ] **Per-product link previews.** Right now every shared URL shows the same
      site-wide Open Graph card (`public/og-image.jpg`, regenerate with
      `npm run og`). WhatsApp and Facebook don't run JavaScript, so a
      product-specific preview image and title needs prerendering or SSR —
      not a small change, but the highest-leverage SEO/sharing win left given
      the whole business runs on shared WhatsApp links.
- [ ] Deposit/pre-order system — biggest upcoming feature, needs its own scoping session
- [ ] Ongoing product catalog expansion as fabric variety grows
- [ ] Marketing/social content push once live
