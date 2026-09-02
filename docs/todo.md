# Baig Cloth — Full Project To-Do List

Status legend: `[x]` done and in the repo · `[ ]` still open · `[~]` done
differently than originally planned (see note).

The build is feature-complete, including a "premium storefront" pass
(animations, wishlist, structured data, PWA installability, CSP, a real
backend test suite). What's left is almost entirely **deployment, content
and QA** — decisions and actions that need the real host, the real domain,
and real devices.

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
- [x] Security hardening: `Permissions-Policy` header; general rate limiting
      (120/min per IP) on public GET endpoints, on top of the existing login
      limiter; `backend/tests/` covers auth-required-on-every-write-route,
      forged-JWT rejection, both rate limiters, price/sale validation, and
      sale-expiry — 26 tests, wired into CI
- [x] `PUT /admin/password` — self-service password change, the only account
      recovery path this single-admin app has (`create_admin.py` skips an
      existing username rather than resetting it)
- [x] Pagination: `GET /products` `limit`/`offset` now actually used by both
      the admin dashboard and the storefront ("Load more") — previously
      anything past the first 100 results was invisible with no indication
      it existed; in the admin panel that meant the *oldest* products
      becoming un-editable as the catalog grew past 100
- [x] Cloudinary uploads now get `f_auto,q_auto` baked into the delivery URL
      (automatic WebP/AVIF + quality) plus a frontend `srcSet` for
      resolution — applies to future admin uploads; the 46 products already
      in the repo use local static files, unaffected
- [ ] Test all endpoints against the *deployed* API once hosting is settled (local testing done)

## Phase 2 — Admin Panel (Frontend)
- [x] `/admin/login` page
- [x] `/admin` dashboard — product list + quick stats
- [x] Add product form (name, category, price, sale price, description, image upload, in-stock toggle)
- [x] Edit/delete product from list
- [x] Category manager — add/rename/delete/reorder per gender
- [x] Sale toggle + optional sale end-date field on product form
- [x] Confirm image upload flow works end-to-end (admin → Cloudinary → URL saved to product)
- [x] Admin bundle code-split (`React.lazy`) out of the storefront bundle —
      storefront visitors no longer download admin CRUD code at all
- [x] `/admin/account` — change-password page (only self-service account
      recovery path; no multi-admin management UI, out of scope for a
      single-shop-owner account)
- [x] Admin dashboard: paginated ("Load more") product list instead of a
      silent 100-item cap

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
- [x] `/men` and `/women` category grid pages, each with its own looping
      gender-specific fabric video banner on the unfiltered view
- [x] `/men/:category` and `/women/:category` filtered pages (chips drive the URL, so filters are shareable)
- [x] Sort (Newest / Price ↑↓ / Name A–Z) on category, sale, and search pages
- [x] `/product/:id` detail page (gallery, price, sale badge, description, WhatsApp CTA, real disabled state when out of stock)
- [x] Product page: click-to-zoom lightbox gallery (arrow-key + Escape support), native share button (Web Share API, clipboard-copy fallback), breadcrumbs, "Recently Viewed" strip
- [x] Wishlist — localStorage-based (no accounts to attach it to server-side); heart on every card + product page, `/wishlist` page, header badge
- [x] `/sale` page — all on_sale products across genders
- [x] `/search` page
- [x] Floating/sticky WhatsApp button — pre-filled message with product name
- [x] Floating back-to-top button (appears after 400px of scroll)
- [x] `/policies` page — ordering, payment, delivery, exchanges & returns, plus a Frequently Asked Questions accordion
- [x] `/about` page, with a looping brand-story fabric video
- [x] Footer with policy links, contact, WhatsApp
- [x] 404 page + app-level error page for unhandled render errors
- [x] Scroll restoration (top on navigate, restore on back/forward)
- [x] Scroll-triggered reveal animations (fade + rise, plays once) across every
      section below the fold — product grids, section headers, FAQ, About —
      all gated on `prefers-reduced-motion`
- [x] Structured data (JSON-LD): `Product` on product pages, `BreadcrumbList`
      on category/product pages, `FAQPage` on Policies, `Organization` on
      the homepage — for Google rich results, separate from the WhatsApp/
      Facebook Open Graph tags (see CLAUDE.md)
- [x] PWA installability — `manifest.webmanifest` + generated app icons,
      "Add to Home Screen" works on mobile (no offline service worker —
      deliberately skipped, see Phase 8)
- [x] Content-Security-Policy (production builds only — see CLAUDE.md for
      why it's gated off in dev)
- [x] `/men`, `/sale`, `/search`: "Load more" pagination instead of a silent
      100-result cap (currently invisible at today's catalog size, but real)
- [x] `favicon.ico` (some browsers/tools probe for it directly regardless of
      the declared `<link rel="icon">`)

## Phase 4 — Content & Assets
- [~] Product photography — 46 real products are live (27 wash-n-wear colors,
      19 women's suits) shot in the shop rather than to the original
      1000×1250 / 4:5 / <400KB spec. Fine for launch; worth a proper reshoot
      later if the catalog grows.
- [x] Write homepage hero headline/copy
- [x] Write policies content (terms, delivery, payment, returns) + FAQ
- [ ] **Have someone review the policies copy** — it's legal-adjacent and currently written in-house
- [x] Populate initial product catalog via the admin panel
- [ ] Decide men's size options phrasing for the description field (per existing convention)
- [x] Three licensed fabric videos in use (`frontend/public/hero/`) — Pexels,
      free for commercial use, no attribution required; credited in code
      comments at each usage site

## Phase 5 — Infrastructure / DevOps
- [ ] Finalize hosting (per Phase 0 decision)
- [ ] Set up staging vs production environments (branch-based)
- [x] GitHub Actions CI — frontend `tsc -b && vite build`, backend migrations +
      `alembic check` (catches models drifting from migrations) + `pytest tests/`,
      against a real Postgres service. `.github/workflows/ci.yml`
- [x] `.htaccess` shipped in `frontend/public/` — SPA fallback (without it,
      refreshing `/men/lawn` or opening a shared `/product/12` link 404s on
      Apache/LiteSpeed), plus cache, compression, and security headers
- [ ] Set all secrets/env vars properly (DB connection string, Cloudinary keys, JWT secret) — never hardcoded
- [ ] **Set `VITE_SITE_URL` in the production build env** — feeds the Open Graph
      URLs, robots.txt and sitemap.xml. The build prints a warning if it's missing.
- [ ] Set real `CORS_ORIGINS` on the API to the live frontend domain — this
      also gates the frontend's CSP `connect-src` (derived from `VITE_API_URL`
      at build time), so both need to agree with the real deployed API origin
- [ ] Connect custom domain + SSL
- [ ] Confirm Postgres backups are happening

## Phase 6 — QA & Testing
- [ ] Test on real mobile devices (not just browser resize) — iOS + Android if possible
- [ ] Test admin CRUD flows end-to-end against the deployed API
- [ ] Test WhatsApp CTA on both mobile and desktop
- [ ] Test sale badge/strikethrough logic, including `sale_ends_at` expiry
- [ ] Cross-browser check (Chrome, Safari at minimum) — pay particular
      attention to Safari's Web Share API and CSS `:has()` (used for the
      reduced-motion-gated smooth scroll) support on older iOS versions
- [ ] Check image/video load performance — three self-hosted videos now
      (~3.2MB, 3.9MB, 2.1MB); consider Cloudinary if the host's bandwidth is tight
- [x] Empty states covered (no products in a category, no active sales, no search results, API unreachable)
- [x] Route smoke test — every public route renders with the right title and
      indexing directive; verified against a production build
- [x] Feature smoke test (wishlist, lightbox, share, sort, FAQ accordion,
      back-to-top, breadcrumbs, JSON-LD, CSP, manifest/icons) — verified
      against a running dev server with zero CSP violations or console errors
- [x] Backend security regression suite (`backend/tests/`, 19 tests) — run
      locally against an isolated throwaway database, never the real one;
      see "Testing" in CLAUDE.md

## Phase 7 — Launch
- [ ] Final review of policies page — make sure it's not a placeholder
- [ ] Verify the WhatsApp/Facebook link preview renders — paste the live URL
      into a WhatsApp chat and check the card. Re-scrape with Facebook's
      Sharing Debugger after any change to `og:image`.
- [ ] Soft launch to friends/family for real-world feedback
- [ ] Go live on custom domain
- [ ] Submit sitemap in Google Search Console
- [ ] Verify Meta Pixel / Conversions API tracking is firing correctly — if/when
      added, remember its `connect-src`/`script-src` domains need adding to
      the CSP in `vite.config.ts`'s `buildCsp()` or it will be silently blocked

## Phase 8 — Post-Launch (next milestones)
- [ ] **Per-product link previews.** Right now every shared URL shows the same
      site-wide Open Graph card (`public/og-image.jpg`, regenerate with
      `npm run og`). WhatsApp and Facebook don't run JavaScript, so a
      product-specific preview image and title needs prerendering or SSR —
      not a small change, but the highest-leverage SEO/sharing win left given
      the whole business runs on shared WhatsApp links.
- [ ] Full offline support (service worker) — deliberately not added alongside
      the PWA manifest; the catalog and sale prices change often enough that
      an offline cache risks showing stale stock/pricing without careful
      cache-invalidation design. Worth a proper scoping pass, not a quick add.
- [ ] Deposit/pre-order system — biggest upcoming feature, needs its own scoping session
- [ ] Ongoing product catalog expansion as fabric variety grows
- [ ] Marketing/social content push once live
