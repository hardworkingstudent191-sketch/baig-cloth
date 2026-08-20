# Baig Cloth — Full Project Map

## 1. Architecture Overview

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   Public Storefront      │        │   Admin Panel             │
│   React 19 + Vite + TS   │◄──────►│   Same frontend, /admin   │
│   Tailwind v4            │  REST  │   route, password-gated   │
│   React Router 7         │  JSON  │                            │
│   Hosted: Railway        │        │                            │
└───────────┬───────────────┘        └────────────┬───────────────┘
            │                                      │
            ▼                                      ▼
      GET /products                     POST/PUT/DELETE /products
      GET /products?category=..                (auth required)
            │                                      │
            └──────────────┬───────────────────────┘
                            ▼
              ┌──────────────────────────┐
              │  FastAPI Backend          │
              │  Hosted: Railway          │
              └───────────┬────────────────┘
                            ▼
              ┌──────────────────────────┐
              │  Postgres DB (Railway)    │
              │  products, categories,    │
              │  admin_users               │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Cloudinary (images)      │
              └──────────────────────────┘
```

**Two Railway services in one project:**
- `baig-cloth-web` (frontend, static build)
- `baig-cloth-api` (FastAPI backend + Postgres plugin)

Both get staging/production environments off `dev`/`main` branches, per your earlier DevOps decision.

---

## 2. Database Schema

**`categories`**
| field | type | notes |
|---|---|---|
| id | serial PK | |
| name | text | e.g. "Lawn", "Cotton" |
| gender | enum('men','women') | |
| sort_order | int | controls nav order, admin-editable |

Categories live in the DB, not code — this is what makes "changing mid-way / vast variety" painless. Adding a new fabric type is an admin form submission, not a deploy.

**`products`**
| field | type | notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| category_id | FK → categories | |
| description | text | includes size info, per your existing convention |
| price | decimal | |
| sale_price | decimal, nullable | |
| on_sale | boolean | drives badge + strikethrough |
| sale_ends_at | timestamp, nullable | optional, for countdown/auto-expiry |
| in_stock | boolean | your existing convention, no quantity field |
| image_urls | text[] | Cloudinary URLs, first = primary |
| featured | boolean | shows on homepage |
| created_at | timestamp | for "New Arrivals" sort |

**`admin_users`**
| field | type | notes |
|---|---|---|
| id | serial PK | |
| username | text | |
| password_hash | text | bcrypt |

Small schema, no cart/order tables needed since ordering stays on WhatsApp for now.

---

## 3. Backend API (FastAPI)

**Public (no auth):**
- `GET /products` — filterable by `?gender=`, `?category=`, `?on_sale=true`, `?featured=true`
- `GET /products/{id}`
- `GET /categories?gender=`

**Admin (JWT-protected):**
- `POST /admin/login`
- `POST /products`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `POST /categories`
- `PUT /categories/{id}` (rename, reorder)
- `DELETE /categories/{id}`
- `POST /upload-image` → proxies to Cloudinary, returns URL

This is a smaller surface than Boutique Manager Cloud's API, so it's a quick build given you have that code to reference.

---

## 4. Site Map (Frontend Routes)

```
/                          Homepage
/men                       Men's category grid
/men/:category             e.g. /men/lawn
/women                     Women's category grid
/women/:category
/sale                      All on_sale=true products, cross-gender
/product/:id               Product detail page
/about                     Optional — brand story, builds trust
/policies                  Terms, delivery, payment, returns (flagged earlier as missing)

/admin/login
/admin                     Dashboard: product list, quick stats
/admin/products/new
/admin/products/:id/edit
/admin/categories
```

---

## 5. Homepage Layout (top to bottom)

1. **Hero** — full-bleed image or slow auto-rotating carousel (reuse your `HeroCarousel.tsx` pattern), short bold headline, single CTA ("Shop Men" / "Shop Women" or "Shop Now")
2. **Category tiles** — 2 large tappable cards: Men / Women, image-backed
3. **Sale strip** — horizontal scroll of on_sale products, only renders if any exist (conditional, not hardcoded)
4. **Featured/New Arrivals** — horizontal scroll, pulled from `featured=true` or sorted by `created_at`
5. **Trust/how-it-works** — 3-icon row: "Browse → Message us on WhatsApp → We confirm & deliver"
6. **Footer** — links to policies, social, contact

Mobile: single column, horizontal scroll rows, sticky WhatsApp button (bottom-right floating).
Desktop: same structure, wider grid (2–4 columns instead of scroll rows), otherwise unchanged — this is why mobile-first works here, you're not designing two different layouts.

---

## 6. Feasibility Check Against Your Requirements

| Requirement | How it's satisfied | Risk |
|---|---|---|
| Mobile + desktop, mobile-first | Tailwind mobile-first breakpoints, single component tree, tested at 375px first | Low — standard practice |
| Easy upload/takedown | Custom admin panel, form-based, no code touching | Low — you've built this exact pattern before |
| Beautiful, "hooked" front page | Hero + tiles + sale strip structure above | Medium — depends on actual photography/copy quality, not just layout |
| Clean, professional layout | Consistent Tailwind design tokens, one component library, no per-page one-offs | Low |
| Easy nav, men/women unstitched | 2-level nav (gender → category), data-driven | Low |
| Vast variety, changing mid-way | Categories stored in DB, admin-editable, not hardcoded routes | Low — this was the main risk and it's solved by the schema choice |
| Run sales | `on_sale`/`sale_price`/`sale_ends_at` fields, auto-badging, dedicated `/sale` page | Low |

**Overall: this holds together.** The one thing to watch is the hero/homepage "wow factor" — that's a design/content execution risk, not an architecture risk, so it'll come down to the actual images and copy you put in, not the code.

---

## 7. Build Order (phased)

1. Backend: schema + CRUD endpoints (reuse Boutique Manager patterns)
2. Admin panel: login + product/category CRUD forms
3. Storefront: category pages + product detail (data-driven, so this works the moment backend is live)
4. Homepage: hero, tiles, sale strip, featured row
5. Policies page (currently missing, blocks buyer confidence — do this before real launch)
6. Staging/production Railway split, final QA on mobile devices
