# Baig Cloth — Placeholder Images (temporary, for testing only)

These are NOT final product photos. They're stand-ins so you can populate
the admin panel, test the storefront layout, and see the sale badges/grids/
gallery working end-to-end — before real product photography is ready.

## How they work

Six on-brand placeholder swatches live in `frontend/public/placeholders/`,
one per category:

```
/placeholders/women-lawn.png
/placeholders/women-cotton.png
/placeholders/women-embroidered.png
/placeholders/men-cotton.png
/placeholders/men-wash-and-wear.png
/placeholders/men-karandi.png
```

They're generated, abstract textile-pattern swatches in the site's own
navy/black/off-white palette — not photos of anything. `scripts/seed_sample_products.py`
assigns each sample product the swatch matching its category.

This replaced an earlier version of this doc that pointed at
picsum.photos/Unsplash. Two reasons for the change: those were random
unrelated stock photos (a lawn suit showing a picture of, say, a mountain),
which looked more broken than helpful once real images actually loaded; and
they depended on an external host being reachable, so anyone testing
offline or in a restricted network saw broken image icons. Local files
side-step both problems and don't cost anything to keep around.

**Why not AI-generate fake "product photos" instead?** Because these are
named as real, orderable products (with real prices) on a live site — an
image that looks like genuine photography, attached to a specific item,
risks a customer ordering based on something that doesn't match what they'd
actually receive. An abstract swatch can't be mistaken for a product photo,
so it doesn't create that risk while still making the storefront look
intentional rather than broken.

## Before you go live

Replace every placeholder with real photos of your actual stock, per the
spec from the site map doc: 1000×1250px, 4:5 ratio, under 400KB JPG, shot in
consistent lighting. Upload through the admin panel's image picker (which
sends them to Cloudinary) rather than editing image_urls directly — that's
Phase 4 on the to-do list.
