# Baig Cloth — Full Project To-Do List

## Phase 0 — Decisions & Cleanup (do first)
- [ ] Check arcoliv.com's Hostinger plan type (shared/cloud vs VPS) — Python only runs on VPS
- [ ] If VPS: confirm tier is enough for frontend + FastAPI + Postgres (KVM 2 minimum recommended)
- [ ] Confirm whether that server is yours to use or Arco Liv's client infrastructure — ask before deploying an unrelated app on it
- [ ] Decide final hosting path: Hostinger VPS vs Railway Hobby ($5/mo) vs other
- [ ] Delete stale duplicate Railway service `baig-cloth-web` (id `d756923e-7ddd-4802-8982-9a6151752959`)
- [ ] Lock in: custom FastAPI admin panel (not headless CMS) — confirmed direction

## Phase 1 — Backend Foundation
- [ ] Set up Postgres database (categories, products, admin_users tables — see schema from site map doc)
- [ ] Scaffold FastAPI project (reuse Boutique Manager Cloud structure as reference)
- [ ] Build JWT auth for admin login
- [ ] Build `GET /products` (with filters: gender, category, on_sale, featured)
- [ ] Build `GET /products/{id}`
- [ ] Build `GET /categories`
- [ ] Build admin CRUD: `POST/PUT/DELETE /products`
- [ ] Build admin CRUD: `POST/PUT/DELETE /categories` (including reorder)
- [ ] Build `POST /upload-image` → Cloudinary integration
- [ ] Test all endpoints locally (Postman/curl) before wiring frontend

## Phase 2 — Admin Panel (Frontend)
- [ ] `/admin/login` page
- [ ] `/admin` dashboard — product list, quick stats (total products, in-stock count)
- [ ] Add product form (name, category, price, sale price, description, image upload, in-stock toggle)
- [ ] Edit/delete product from list
- [ ] Category manager — add/rename/delete/reorder categories per gender
- [ ] Sale toggle + optional sale end-date field on product form
- [ ] Confirm image upload flow works end-to-end (admin → Cloudinary → URL saved to product)

## Phase 3 — Public Storefront
- [ ] Homepage: hero carousel (reuse `HeroCarousel.tsx` pattern)
- [ ] Homepage: Men/Women category tiles
- [ ] Homepage: sale strip (conditional — only renders if on_sale products exist)
- [ ] Homepage: featured/new arrivals row
- [ ] Homepage: "how it works" trust section (Browse → WhatsApp → Confirm)
- [ ] `/men` and `/women` category grid pages
- [ ] `/men/:category` and `/women/:category` filtered pages
- [ ] `/product/:id` detail page (images, price, sale badge, description, size info, WhatsApp CTA)
- [ ] `/sale` page — all on_sale products across genders
- [ ] Floating/sticky WhatsApp button — pre-filled message with product name
- [ ] `/policies` page — terms, delivery, payment, returns (known gap, write content)
- [ ] `/about` page (optional — brand story)
- [ ] Footer with policy links, contact, socials

## Phase 4 — Content & Assets
- [ ] Product photography shot/edited to spec: 1000×1250px, 4:5 ratio, under 400KB JPG
- [ ] Write homepage hero headline/copy
- [ ] Write policies content (terms, delivery, payment, returns) — legal-adjacent, worth having someone review
- [ ] Populate initial product catalog via the new admin panel (not the old CSV approach)
- [ ] Decide men's size options phrasing for the description field (per existing convention)

## Phase 5 — Infrastructure / DevOps
- [ ] Finalize hosting (per Phase 0 decision)
- [ ] Set up staging vs production environments (branch-based)
- [ ] Add GitHub Actions: type-check (`tsc`) + build validation on every push
- [ ] Set all secrets/env vars properly (DB connection string, Cloudinary keys, JWT secret) — never hardcoded
- [ ] Connect custom domain + SSL
- [ ] Confirm Postgres backups are happening (Railway auto-backups, or manual on VPS)

## Phase 6 — QA & Testing
- [ ] Test on real mobile devices (not just browser resize) — iOS + Android if possible
- [ ] Test admin CRUD flows end-to-end: add product → appears on storefront → edit → sale toggle works → delete
- [ ] Test WhatsApp CTA on both mobile and desktop
- [ ] Test sale badge/strikethrough logic, including sale_ends_at expiry if implemented
- [ ] Cross-browser check (Chrome, Safari at minimum)
- [ ] Check image load performance (compressed sizes, lazy loading if needed)
- [ ] Test empty states (no products in a category, no active sales)

## Phase 7 — Launch
- [ ] Final review of policies page — make sure it's not a placeholder
- [ ] Soft launch to friends/family for real-world feedback
- [ ] Go live on custom domain
- [ ] Verify Meta Pixel / Conversions API tracking is firing correctly (per your existing plan)

## Phase 8 — Post-Launch (next milestones)
- [ ] Deposit/pre-order system — biggest upcoming feature, needs its own scoping session
- [ ] Ongoing product catalog expansion as fabric variety grows
- [ ] Marketing/social content push once live
