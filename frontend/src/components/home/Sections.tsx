import { useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowUpRight, MessageCircle, Search as SearchIcon, PackageCheck, Star, Instagram, MapPin, Clock } from "lucide-react";
import type { Collection, HomeData, InstagramPost, Product, SiteSettings, Testimonial } from "../../lib/types";
import { imageSource } from "../../lib/images";
import { images as media } from "../../generated/media";
import { EASE } from "../../lib/motion";
import { whatsappUrl, generalEnquiryMessage } from "../../lib/whatsapp";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";
import { ButtonAnchor, ButtonLink } from "../ui/Button";
import { ProductRail } from "../product/ProductGrid";
import { CollectionCard } from "../../pages/CollectionsPage";
import Price from "../ui/Price";
import Img from "../ui/Img";

/* ------------------------------------------------------------------ */
/* Marquee: a slow ticker of what we sell — editorial texture, zero cost */
/* ------------------------------------------------------------------ */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="border-y border-line bg-ivory py-3.5 overflow-hidden" aria-hidden="true">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] motion-reduce:animate-none">
        {row.map((t, i) => (
          <span key={i} className="eyebrow text-charcoal/70 px-6 flex items-center gap-6">
            {t}<span className="h-1 w-1 rounded-full bg-sand" />
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shop by: two portrait tiles                                          */
/* ------------------------------------------------------------------ */
export function ShopBy({ counts, featured }: { counts: HomeData["counts"]; featured: Product[] }) {
  const tile = (gender: "women" | "men") => {
    const placeholder = media[`tile-${gender}`];
    const fallback = featured.find((p) => (gender === "women" ? p.pieces === 3 : p.pieces !== 3));
    const img = placeholder ? { src: placeholder.src, srcSet: placeholder.srcSet, alt: placeholder.alt } : fallback ? imageSource(fallback.images[0] ?? { url: fallback.image_urls[0] }, 1000, "") : null;
    return { img, label: gender === "women" ? "Women" : "Men", sub: gender === "women" ? "Lawn · Cotton · Embroidered" : "Wash & Wear · Cotton · Karandi", count: counts[gender] };
  };
  const tiles = [tile("women"), tile("men")] as const;
  return (
    <section className="gutter pt-14 md:pt-24">
      <ul className="grid grid-cols-2 gap-3 md:gap-6">
        {tiles.map((t, i) => (
          <Reveal key={t.label} as="li" delay={i * 0.1}>
            <Link to={`/${t.label.toLowerCase()}`} className="group relative block aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-card bg-bone">
              {t.img && <Img src={t.img.src} srcSet={t.img.srcSet} sizes="50vw" alt={t.img.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1400ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.05]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/0 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-7 text-ivory">
                <p className="eyebrow text-ivory/70 mb-1">{t.count} pieces</p>
                <h3 className="font-display text-[1.8rem] md:text-4xl leading-none flex items-end gap-2">{t.label}<ArrowUpRight size={22} className="mb-1 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" /></h3>
                <p className="hidden md:block mt-1.5 text-sm text-ivory/80">{t.sub}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Collections rail                                                      */
/* ------------------------------------------------------------------ */
export function CollectionsRail({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) return null;
  return (
    <section className="gutter pt-16 md:pt-28">
      <SectionHeading eyebrow="Curated" title="Collections" link="/collections" />
      <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-[var(--page-gutter)] px-[var(--page-gutter)] md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
        {collections.map((c, i) => (
          <div key={c.id} className="w-[78vw] sm:w-[48vw] md:w-auto shrink-0 snap-start contents-none">
            <CollectionCard c={c} index={i} />
          </div>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Product rail section wrapper                                          */
/* ------------------------------------------------------------------ */
export function RailSection({ eyebrow, title, link, products }: { eyebrow: string; title: string; link?: string; products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="gutter pt-16 md:pt-28">
      <SectionHeading eyebrow={eyebrow} title={title} link={link} />
      <ProductRail products={products} />
      {link && <div className="mt-6 sm:hidden"><ButtonLink to={link} variant="secondary" className="w-full">See all</ButtonLink></div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Colour wall: the wash & wear family, tap a swatch to see the fabric   */
/* ------------------------------------------------------------------ */
export function ColourWall({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0);
  if (products.length < 6) return null;
  const current = products[active];
  const img = current ? imageSource(current.images[0] ?? { url: current.image_urls[0] }, 1000, current.name) : null;
  return (
    <section className="mt-16 md:mt-28 bg-charcoal text-ivory">
      <div className="gutter py-14 md:py-24 grid gap-8 md:grid-cols-12 md:gap-12 items-center">
        <div className="md:col-span-5 order-2 md:order-1">
          <Reveal>
            <p className="eyebrow text-ivory/60 mb-3">Men · Wash & Wear</p>
            <h2 className="font-display text-[2.2rem] md:text-[3.2rem] leading-[1.02] text-balance">One suit. <br className="hidden md:block" />{products.length} colours.</h2>
            <p className="mt-4 text-ivory/70 text-[15px] md:text-base max-w-md text-pretty">Crease-resistant wash & wear that's ready for the tailor. Tap a colour to see the real fabric.</p>
          </Reveal>
          <ul className="mt-7 grid grid-cols-7 sm:grid-cols-9 md:grid-cols-7 gap-2" aria-label="Colours">
            {products.map((p, i) => (
              <li key={p.id}>
                <button type="button" onClick={() => setActive(i)} aria-pressed={i === active} aria-label={p.color || p.name} title={p.color || p.name} className={`relative aspect-square w-full rounded-full border-2 transition-transform duration-300 active:scale-90 ${i === active ? "border-ivory scale-110" : "border-transparent hover:scale-105"}`}>
                  <span className="absolute inset-[3px] rounded-full" style={{ background: p.color_hex || "#999" }} />
                </button>
              </li>
            ))}
          </ul>
          {/* Stacked on phones so the WhatsApp button (bottom-right) never covers the CTA. */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AnimatePresence mode="wait">
              <motion.div key={current?.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <p className="font-display text-xl">{current?.color || current?.name}</p>
                {current && <Price product={current} className="text-ivory/80" />}
              </motion.div>
            </AnimatePresence>
            {current && (
              <Link to={`/product/${current.id}`} className="group inline-flex h-12 sm:h-11 items-center justify-center gap-2 rounded-pill bg-ivory text-charcoal px-5 text-sm font-medium w-full sm:w-auto mr-0 sm:mr-20">
                View this colour <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
        <div className="md:col-span-7 order-1 md:order-2">
          <div className="relative aspect-[4/5] md:aspect-[4/5] max-h-[70vh] overflow-hidden rounded-card bg-ink/40">
            <AnimatePresence mode="sync">
              {img && (
                <motion.img key={current.id} src={img.src} srcSet={img.srcSet} sizes="(min-width: 768px) 55vw, 100vw" alt={img.alt} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE.outExpo }} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                          */
/* ------------------------------------------------------------------ */
export function HowItWorks({ site }: { site: SiteSettings }) {
  const steps = [
    { icon: SearchIcon, title: "Browse", body: "Find pieces you like. Save them, or add a few to your bag." },
    { icon: MessageCircle, title: "WhatsApp us", body: "One tap sends your pieces to us. Ask for close-ups, colours, metres — a real person answers." },
    { icon: PackageCheck, title: "Delivered", body: `Cut, folded and dispatched from ${site.city} to your door across Pakistan.` },
  ];
  return (
    <section className="gutter pt-16 md:pt-28">
      <SectionHeading eyebrow="No account, no checkout" title="How ordering works" align="center" />
      <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map((s, i) => (
          <Reveal key={s.title} as="li" delay={i * 0.1} className="relative rounded-card border border-line p-6 md:p-8 bg-bone/40">
            <span className="font-display text-5xl text-sand leading-none absolute right-5 top-4">0{i + 1}</span>
            <s.icon size={26} strokeWidth={1.3} className="text-navy mb-5" />
            <h3 className="font-display text-2xl mb-2">{s.title}</h3>
            <p className="text-sm md:text-[15px] text-muted text-pretty leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </ol>
      <Reveal className="mt-8 flex justify-center">
        <ButtonAnchor href={whatsappUrl(site.whatsapp, generalEnquiryMessage())} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg"><MessageCircle size={18} /> Start a chat</ButtonAnchor>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sale strip                                                            */
/* ------------------------------------------------------------------ */
export function SaleStrip({ sale }: { sale: HomeData["sale"] }) {
  if (sale.count === 0) return null;
  return (
    <section className="gutter pt-16 md:pt-28">
      <Reveal className="rounded-card bg-navy text-ivory p-6 md:p-10 grid gap-6 md:grid-cols-12 items-center">
        <div className="md:col-span-5">
          <p className="eyebrow text-ivory/60 mb-2">Limited time</p>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">{sale.count} {sale.count === 1 ? "piece" : "pieces"} on sale</h2>
          <ButtonLink to="/sale" className="mt-5 bg-ivory text-charcoal hover:bg-bone">See the sale <ArrowRight size={16} /></ButtonLink>
        </div>
        <ul className="md:col-span-7 grid grid-cols-4 gap-2 md:gap-3">
          {sale.preview.map((p) => {
            const src = imageSource(p.images[0] ?? { url: p.image_urls[0] }, 400, p.name);
            return (
              <li key={p.id}>
                <Link to={`/product/${p.id}`} className="block aspect-[4/5] overflow-hidden rounded-card bg-ink/20">
                  <img src={src.src} srcSet={src.srcSet} sizes="20vw" alt={src.alt} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials carousel                                                 */
/* ------------------------------------------------------------------ */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [ref, embla] = useEmblaCarousel({ loop: items.length > 1, align: "start" });
  if (items.length === 0) return null;
  return (
    <section className="gutter pt-16 md:pt-28">
      <SectionHeading eyebrow="From our customers" title="Kind words" />
      <div ref={ref} className="overflow-hidden -mx-[var(--page-gutter)] px-[var(--page-gutter)]">
        <ul className="flex gap-4 md:gap-6">
          {items.map((t) => (
            <li key={t.id} className="min-w-0 flex-[0_0_86%] sm:flex-[0_0_60%] md:flex-[0_0_46%] lg:flex-[0_0_32%]">
              <figure className="h-full rounded-card border border-line p-6 md:p-8 flex flex-col bg-ivory">
                <div className="flex gap-0.5 text-navy mb-4" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < t.rating ? "fill-current" : "opacity-25"} />)}
                </div>
                <blockquote className="font-display text-[1.35rem] md:text-2xl leading-snug text-pretty flex-1">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-sm">
                  {t.photo ? <Img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" /> : <span className="h-10 w-10 rounded-full bg-bone grid place-items-center font-display">{t.name.charAt(0)}</span>}
                  <span><span className="font-medium">{t.name}</span>{t.city && <span className="text-muted"> · {t.city}</span>}{t.source && <span className="block text-xs text-muted">via {t.source}</span>}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
      {items.length > 1 && (
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => embla?.scrollPrev()} className="h-10 w-10 rounded-full border border-line grid place-items-center hover:bg-bone" aria-label="Previous"><ArrowRight size={16} className="rotate-180" /></button>
          <button type="button" onClick={() => embla?.scrollNext()} className="h-10 w-10 rounded-full border border-line grid place-items-center hover:bg-bone" aria-label="Next"><ArrowRight size={16} /></button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Instagram grid                                                        */
/* ------------------------------------------------------------------ */
export function InstagramGrid({ posts, handle }: { posts: InstagramPost[]; handle?: string }) {
  if (posts.length === 0) return null;
  return (
    <section className="gutter pt-16 md:pt-28">
      <SectionHeading eyebrow="Instagram" title="Follow along" link={handle} linkLabel="Open Instagram" />
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {posts.slice(0, 8).map((p, i) => (
          <Reveal key={p.id} as="li" delay={(i % 4) * 0.06}>
            <a href={p.link || handle || "#"} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-card bg-bone" aria-label={p.caption || "Instagram post"}>
              {p.image && <Img src={p.image} alt={p.caption} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1200ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.06]" />}
              <span className="absolute inset-0 grid place-items-center bg-ink/0 group-hover:bg-ink/30 transition-colors text-ivory opacity-0 group-hover:opacity-100"><Instagram size={24} /></span>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Store block                                                           */
/* ------------------------------------------------------------------ */
export function StoreBlock({ site }: { site: SiteSettings }) {
  const still = media["store-front"];
  return (
    <section className="gutter pt-16 md:pt-28">
      <Reveal className="grid gap-0 md:grid-cols-12 rounded-card overflow-hidden border border-line">
        <div className="md:col-span-5 aspect-[16/10] md:aspect-auto bg-bone">
          {still ? <Img src={still.src} srcSet={still.srcSet} sizes="(min-width: 768px) 40vw, 100vw" alt={still.alt} loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-bone to-sand" />}
        </div>
        <div className="md:col-span-7 p-6 md:p-10">
          <p className="eyebrow text-muted mb-2">Visit us in {site.city}</p>
          <h2 className="font-display text-3xl md:text-4xl leading-tight mb-5">Come and feel the fabric</h2>
          <div className="grid gap-4 sm:grid-cols-2 text-[15px]">
            <p className="flex gap-2.5"><MapPin size={18} className="shrink-0 mt-0.5" strokeWidth={1.5} /><span>{site.address.join(", ")}</span></p>
            {site.hours.length > 0 && (
              <div className="flex gap-2.5"><Clock size={18} className="shrink-0 mt-0.5" strokeWidth={1.5} /><ul>{site.hours.map((h) => <li key={h.days}><span className="text-muted">{h.days}</span> {h.hours}</li>)}</ul></div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/store" variant="secondary">Directions & hours</ButtonLink>
            <ButtonAnchor href={whatsappUrl(site.whatsapp, generalEnquiryMessage())} target="_blank" rel="noopener noreferrer" variant="whatsapp"><MessageCircle size={18} /> WhatsApp</ButtonAnchor>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
