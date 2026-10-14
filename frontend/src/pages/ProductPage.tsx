import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Heart, MessageCircle, Plus, Share2, Check, ChevronDown, Truck, Scissors, Ruler } from "lucide-react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useShop } from "../lib/store";
import { useSite } from "../lib/site";
import { usePageMeta } from "../lib/usePageMeta";
import { useJsonLd } from "../lib/useJsonLd";
import { imageSource } from "../lib/images";
import { discountLabel, effectivePrice, formatPrice, slugify } from "../lib/format";
import { singleProductMessage, whatsappUrl } from "../lib/whatsapp";
import { EASE } from "../lib/motion";
import type { Product } from "../lib/types";
import Gallery from "../components/product/Gallery";
import { ProductRail } from "../components/product/ProductGrid";
import Price from "../components/ui/Price";
import Badge from "../components/ui/Badge";
import { Button, ButtonAnchor } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal from "../components/ui/Reveal";
import NotFoundPage from "./NotFoundPage";

export default function ProductPage() {
  const { id = "" } = useParams();
  const numericId = Number(id);
  const valid = Number.isInteger(numericId) && numericId > 0;
  const { data: product, loading, error, notFound, reload } = useFetch((signal) => api.product(numericId, signal), `product-${id}`, valid);

  if (!valid || notFound) return <NotFoundPage />;
  if (error) return <div className="gutter py-16"><ErrorState message={error.message} onRetry={reload} /></div>;
  if (loading || !product) return <ProductSkeleton />;
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const site = useSite();
  const addToBag = useShop((s) => s.addToBag);
  const inBag = useShop((s) => s.bag.some((b) => b.id === product.id));
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const saved = useShop((s) => s.wishlist.includes(product.id));
  const recordView = useShop((s) => s.recordView);
  const recentlyViewed = useShop((s) => s.recentlyViewed);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    recordView(product.id);
    window.scrollTo({ top: 0 });
  }, [product.id, recordView]);

  const { data: categories } = useFetch((signal) => api.categories(undefined, signal), "cats-all");
  const category = categories?.find((c) => c.id === product.category_id);
  const gender = category?.gender;

  const images = product.images.length ? product.images : product.image_urls.map((url) => ({ url }));
  const hero = images[0] ? imageSource(images[0], 1000, product.name) : null;
  const discount = discountLabel(product);
  const waMessage = singleProductMessage(product);

  usePageMeta({ title: product.name, description: `${product.name} — ${product.fabric || "unstitched fabric"}${product.pieces ? `, ${product.pieces}-piece` : ""}. Rs ${Math.round(effectivePrice(product)).toLocaleString()}. Order over WhatsApp from Baig Cloth.` });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku || undefined,
    image: images.map((i) => (i.url.startsWith("/") ? window.location.origin + i.url : i.url)),
    description: product.description || undefined,
    color: product.color || undefined,
    material: product.fabric || undefined,
    brand: { "@type": "Brand", name: "Baig Cloth" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: effectivePrice(product).toFixed(2),
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${window.location.origin}/product/${product.id}`,
    },
  });

  // Related: same category, excluding this one and its colour variants.
  const variantIds = useMemo(() => new Set(product.variants.map((v) => v.id)), [product.variants]);
  const { data: related } = useFetch((signal) => api.products({ category_id: product.category_id, limit: 12 }, signal), `related-${product.category_id}`);
  const relatedProducts = (related?.items ?? []).filter((p) => p.id !== product.id && !variantIds.has(p.id)).slice(0, 8);
  const recentIds = useMemo(() => recentlyViewed.filter((r) => r !== product.id).slice(0, 8), [recentlyViewed, product.id]);
  const { data: recent } = useFetch((signal) => api.productsByIds(recentIds, signal), `recent-${recentIds.join(",")}`, recentIds.length > 0);

  function add() {
    addToBag(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }
  async function share() {
    const url = `${window.location.origin}/product/${product.id}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text: `${product.name} — Baig Cloth`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      /* user cancelled */
    }
  }

  const badges = (
    <>
      {product.is_new && <Badge tone="ivory">New</Badge>}
      {discount && <Badge tone="sale">{discount}</Badge>}
      {!product.in_stock && <Badge tone="ink">Sold out</Badge>}
    </>
  );

  return (
    <article className="pb-28 md:pb-8">
      <div className="gutter pt-4 md:pt-8 grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="md:col-span-7 lg:col-span-7 md:sticky md:top-[calc(var(--header-h)+16px)] md:self-start">
          <Gallery images={images} name={product.name} badges={badges} />
        </div>

        {/* Details */}
        <div className="md:col-span-5 lg:col-span-5">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted flex flex-wrap gap-1">
            <Link to="/" className="hover:text-charcoal">Home</Link>
            {gender && (<><span>/</span><Link to={`/${gender}`} className="hover:text-charcoal capitalize">{gender}</Link></>)}
            {category && gender && (<><span>/</span><Link to={`/${gender}/${slugify(category.name)}`} className="hover:text-charcoal">{category.name}</Link></>)}
          </nav>
          <p className="eyebrow text-muted mb-2">{[product.fabric, product.pieces ? `${product.pieces}-piece` : null, product.sku].filter(Boolean).join(" · ")}</p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE.outExpo }} className="font-display text-[2rem] md:text-[2.6rem] leading-[1.05] text-balance">{product.name}</motion.h1>
          <div className="mt-3 flex items-center gap-3">
            <Price product={product} size="lg" />
            {discount && <Badge tone="sale">{discount}</Badge>}
          </div>
          {product.on_sale && product.sale_ends_at && (
            <p className="mt-1 text-xs text-muted">Sale price until {new Date(product.sale_ends_at).toLocaleDateString("en-PK", { day: "numeric", month: "long" })}</p>
          )}

          {/* Colour variants */}
          {(product.color || product.variants.length > 0) && (
            <div className="mt-6">
              <p className="text-sm mb-2.5"><span className="text-muted">Colour:</span> {product.color || "—"}{product.variants.length > 0 && <span className="text-muted"> · {product.variants.length + 1} available</span>}</p>
              {product.variants.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  <li>
                    <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-charcoal" title={product.color}>
                      <span className="h-8 w-8 rounded-full border border-black/10" style={{ background: product.color_hex || "#ccc" }} />
                    </span>
                  </li>
                  {product.variants.map((v) => (
                    <li key={v.id}>
                      <Link to={`/product/${v.id}`} title={v.color || v.name} aria-label={v.color || v.name} className={`grid h-10 w-10 place-items-center rounded-full border-2 border-transparent hover:border-charcoal/50 transition-colors ${v.in_stock ? "" : "opacity-40"}`}>
                        <span className="h-8 w-8 rounded-full border border-black/10" style={{ background: v.color_hex || "#ccc" }} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* What's included */}
          {product.piece_details.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-muted mb-2.5">What's included</p>
              <ul className="flex flex-wrap gap-2">
                {product.piece_details.map((d) => (
                  <li key={d.name} className="rounded-pill border border-line px-3.5 py-1.5 text-sm"><span className="font-medium">{d.name}</span> <span className="text-muted">{d.meters} m</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions (desktop inline; phones get the sticky bar below) */}
          <div className="mt-8 hidden md:flex flex-col gap-3">
            <div className="flex gap-3">
              <Button size="lg" variant="secondary" className="flex-1" onClick={add} disabled={!product.in_stock}>
                {added ? <><Check size={18} /> Added</> : inBag ? <><Check size={18} /> In your bag</> : <><Plus size={18} /> Add to bag</>}
              </Button>
              <button type="button" onClick={() => toggleWishlist(product.id)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save"} className="grid h-13 w-13 place-items-center rounded-pill border border-charcoal/60 hover:bg-bone">
                <Heart size={20} strokeWidth={1.7} className={saved ? "fill-sale text-sale" : ""} />
              </button>
            </div>
            <ButtonAnchor href={whatsappUrl(site.whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" className="w-full" aria-disabled={!product.in_stock}>
              <MessageCircle size={18} /> {product.in_stock ? "Order on WhatsApp" : "Ask when it's back"}
            </ButtonAnchor>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex gap-2.5"><Truck size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" /><span>{site.delivery_note || "Delivery across Pakistan; charges confirmed on WhatsApp."}</span></li>
            <li className="flex gap-2.5"><Scissors size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" /><span>Unstitched — cut to length, ready for your tailor.</span></li>
            <li className="flex gap-2.5"><Ruler size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" /><span>Not sure about metres? <Link to="/size-guide" className="underline hover:text-charcoal">Size & measurement guide</Link></span></li>
          </ul>

          <div className="mt-8 border-t border-line">
            <Accordion title="Description" defaultOpen>
              {product.description ? <p className="text-pretty">{product.description}</p> : <p>No description yet — ask us anything about this piece on WhatsApp.</p>}
            </Accordion>
            {(product.details.length > 0 || product.fabric) && (
              <Accordion title="Details">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
                  {product.fabric && !product.details.some((d) => d.label.toLowerCase() === "fabric") && (<><dt className="text-muted">Fabric</dt><dd>{product.fabric}</dd></>)}
                  {product.details.map((d) => (<div key={d.label} className="contents"><dt className="text-muted">{d.label}</dt><dd>{d.value}</dd></div>))}
                  {product.sku && (<><dt className="text-muted">Code</dt><dd>{product.sku}</dd></>)}
                </dl>
              </Accordion>
            )}
            {product.care && <Accordion title="Care"><p className="text-pretty">{product.care}</p></Accordion>}
            <Accordion title="Delivery & returns">
              <p className="text-pretty">{site.delivery_note || "Delivery across Pakistan in 3–5 working days; charges confirmed on WhatsApp."} Unstitched fabric can't be returned once cut; damaged or incorrect pieces are sorted out within 48 hours of delivery. <Link to="/policies" className="underline">Full policy</Link>.</p>
            </Accordion>
          </div>

          <button type="button" onClick={share} className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-charcoal">
            {shared ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Share this piece</>}
          </button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="gutter mt-20 md:mt-28">
          <SectionHeading eyebrow={category ? category.name : "Related"} title="You might also like" link={gender && category ? `/${gender}/${slugify(category.name)}` : undefined} />
          <ProductRail products={relatedProducts} />
        </section>
      )}
      {recent && recent.length > 0 && (
        <section className="gutter mt-20 md:mt-28">
          <SectionHeading eyebrow="On this device" title="Recently viewed" />
          <ProductRail products={recent} />
        </section>
      )}

      {/* Sticky phone action bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-ivory/95 backdrop-blur-md border-t border-line px-4 pt-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-2.5">
          {hero && <img src={hero.src} alt="" className="hidden min-[420px]:block h-11 w-9 object-cover rounded-sm shrink-0" />}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[15px] font-medium whitespace-nowrap">{formatPrice(effectivePrice(product))}</p>
            {discount && <p className="text-[11px] text-sale whitespace-nowrap">{discount} · was {formatPrice(product.price)}</p>}
          </div>
          <button type="button" onClick={() => toggleWishlist(product.id)} aria-pressed={saved} aria-label="Save" className="hidden min-[420px]:grid h-11 w-11 place-items-center rounded-pill border border-line shrink-0"><Heart size={18} strokeWidth={1.7} className={saved ? "fill-sale text-sale" : ""} /></button>
          <Button variant="secondary" onClick={add} disabled={!product.in_stock} className="px-4 shrink-0" aria-label="Add to bag">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={added ? "y" : "n"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-1.5">
                {added ? <Check size={18} /> : <Plus size={18} />} Bag
              </motion.span>
            </AnimatePresence>
          </Button>
          <ButtonAnchor href={whatsappUrl(site.whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" variant="whatsapp" className="px-5 shrink-0"><MessageCircle size={18} /> {product.in_stock ? "Order" : "Ask"}</ButtonAnchor>
        </div>
      </div>
    </article>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between py-4 text-left text-[15px] font-medium">
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-muted"><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE.outQuart }} className="overflow-hidden">
            <div className="pb-5 text-[15px] leading-relaxed text-charcoal/85">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="gutter pt-4 md:pt-8 grid gap-8 md:grid-cols-12 md:gap-10" aria-busy="true">
      <div className="md:col-span-7"><Skeleton className="aspect-[4/5] -mx-[var(--page-gutter)] md:mx-0 rounded-none md:rounded-card" /></div>
      <div className="md:col-span-5 space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full mt-8" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
