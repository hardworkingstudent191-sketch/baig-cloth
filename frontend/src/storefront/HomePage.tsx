import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storefrontApi } from "./api";
import type { Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";
import { usePageMeta } from "../usePageMeta";

export default function HomePage() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [womenImage, setWomenImage] = useState<string | null>(null);
  const [menImage, setMenImage] = useState<string | null>(null);
  const [allowMotion, setAllowMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  usePageMeta({
    title: "Unstitched Fabric for Men & Women",
    description:
      "Hand-picked lawn, cotton, wash-and-wear and embroidered unstitched fabric for men and women. Browse the catalog and order directly over WhatsApp.",
  });

  useEffect(() => {
    // Respect prefers-reduced-motion: skip the hero video (and the CSS
    // entrance/drift animations, gated separately in storefront.css) so
    // motion is never forced on someone who's asked their system to avoid
    // it. Without the video the dark duotone gradient underneath is the
    // whole background — designed to look complete on its own.
    setAllowMotion(window.matchMedia("(prefers-reduced-motion: no-preference)").matches);
  }, []);

  useEffect(() => {
    storefrontApi.listProducts({ on_sale: true }).then(setSaleProducts).catch((err) => {
      console.error("Failed to load sale products", err);
    });
    storefrontApi.listProducts({ featured: true }).then(setFeaturedProducts).catch((err) => {
      console.error("Failed to load featured products", err);
    });
    // Category tiles were designed to be image-backed (per the site map),
    // but had no image at all — just a flat color block. Use each gender's
    // most recent product photo as a representative tile background.
    storefrontApi.listProducts({ gender: "women" }).then((products) => {
      const withImage = products.find((p) => p.image_urls[0]);
      if (withImage) setWomenImage(withImage.image_urls[0]);
    }).catch(() => {});
    storefrontApi.listProducts({ gender: "men" }).then((products) => {
      const withImage = products.find((p) => p.image_urls[0]);
      if (withImage) setMenImage(withImage.image_urls[0]);
    }).catch(() => {});
  }, []);

  return (
    <StorefrontLayout>
      {/* Hero — a dark "cutting mat" base (works alone if the video can't
          play), with real fabric footage layered on top when motion is
          allowed. Video: Pexels, free for commercial use, no attribution
          required (pexels.com/video/close-up-video-of-a-fabric-6279031). */}
      <section className="relative hero-weave tape-edge border-b border-dashed border-[#0a0e1a]">
        {allowMotion && (
          <video
            className={`hero-video${videoReady ? " is-ready" : ""}`}
            src="/hero/fabric-flow.mp4"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
          />
        )}
        <div className="hero-scrim" />
        <div className="hero-content max-w-6xl mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          <span className="fabric-tag font-mono text-[11px] tracking-[0.2em] text-[#1f2937] uppercase">
            Unstitched Fabric
          </span>
          <h1
            className="hero-rise font-serif font-medium text-4xl leading-[1.15] md:text-7xl md:leading-[0.95] tracking-tight max-w-3xl mx-auto mt-5 text-[#f7f7f5]"
            style={{ ["--hero-delay" as string]: "120ms" }}
          >
            Cloth worth cutting into something of your own.
          </h1>
          <p
            className="hero-rise text-[#e2e5ec] mt-4 max-w-md mx-auto"
            style={{ ["--hero-delay" as string]: "260ms" }}
          >
            Hand-picked lawn, cotton, and embroidered fabric for men and women — ordered directly over WhatsApp.
          </p>
          <div
            className="hero-rise flex gap-3 justify-center mt-8"
            style={{ ["--hero-delay" as string]: "380ms" }}
          >
            <Link
              to="/women"
              className="bg-[#3f5fc4] text-[#f7f7f5] px-6 py-3 rounded text-sm hover:bg-[#5470d6] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
            >
              Shop Women
            </Link>
            <Link
              to="/men"
              className="border border-[#f7f7f5]/70 text-[#f7f7f5] px-6 py-3 rounded text-sm hover:bg-[#f7f7f5] hover:text-[#101014] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
            >
              Shop Men
            </Link>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryTile to="/women" label="Women" sub="Lawn, chiffon, embroidered & more" image={womenImage} />
        <CategoryTile to="/men" label="Men" sub="Cotton, wash-and-wear, khaddar" image={menImage} />
      </section>

      {/* Sale strip — only renders if there are active sale products.
          Full-bleed tinted band so the sale reads as its own zone. */}
      {saleProducts.length > 0 && (
        <section className="band py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl">On Sale</h2>
              <Link to="/sale" className="text-sm text-[#1a2f66] hover:underline">
                View all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
              {saleProducts.slice(0, 8).map((p) => (
                <div key={p.id} className="w-40 shrink-0 md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured / new arrivals */}
      {featuredProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="font-serif text-2xl mb-4">Featured</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
            {featuredProducts.slice(0, 8).map((p) => (
              <div key={p.id} className="w-40 shrink-0 md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust / how it works — dark panel, bookending the dark hero so the
          page opens and closes dark with the catalog held in the light. */}
      <section className="panel-dark tape-edge mt-12 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <Step title="Browse" body="Explore fabric by category and find what suits you." />
            <Step title="Message us" body="Tap a product and send us a WhatsApp message." />
            <Step title="We confirm" body="We confirm availability and arrange delivery." />
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

function CategoryTile({
  to,
  label,
  sub,
  image,
}: {
  to: string;
  label: string;
  sub: string;
  image: string | null;
}) {
  return (
    <Link
      to={to}
      className="group relative aspect-[16/9] md:aspect-[4/3] bg-[#eef0f3] rounded-lg overflow-hidden border border-[#dde1e8] flex items-end p-6"
    >
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#101014]/60 via-[#101014]/10 to-transparent" />
      <div className="tile-peel" />
      <div className="relative text-[#f7f7f5]">
        <h3 className="font-serif text-3xl">{label}</h3>
        <p className="text-sm text-[#e6e9ee] mt-1">{sub}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-2 border-t border-dashed border-[#f7f7f5]/30" />
    </Link>
  );
}

function Step({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-serif text-lg mb-1.5 text-[#f7f7f5]">{title}</h3>
      <p className="text-[#c9cfdb] text-sm">{body}</p>
    </div>
  );
}
