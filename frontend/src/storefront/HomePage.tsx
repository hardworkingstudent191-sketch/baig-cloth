import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storefrontApi } from "./api";
import type { Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";

export default function HomePage() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    storefrontApi.listProducts({ on_sale: true }).then(setSaleProducts).catch(() => {});
    storefrontApi.listProducts({ featured: true }).then(setFeaturedProducts).catch(() => {});
  }, []);

  return (
    <StorefrontLayout>
      {/* Hero */}
      <section className="relative bg-[#ece3d1] border-b border-dashed border-[#d8cdb8]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <p className="font-mono text-xs tracking-[0.25em] text-[#a9987e] uppercase mb-4">
            Unstitched Fabric
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight max-w-2xl mx-auto">
            Cloth worth cutting into something of your own.
          </h1>
          <p className="text-[#4a4237] mt-4 max-w-md mx-auto">
            Hand-picked lawn, cotton, and embroidered fabric for men and women — ordered directly over WhatsApp.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <Link
              to="/women"
              className="bg-[#7a1930] text-[#f6f1e6] px-6 py-3 rounded text-sm hover:bg-[#8f1f39] transition-colors"
            >
              Shop Women
            </Link>
            <Link
              to="/men"
              className="border border-[#241f1a] px-6 py-3 rounded text-sm hover:bg-[#241f1a] hover:text-[#f6f1e6] transition-colors"
            >
              Shop Men
            </Link>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryTile to="/women" label="Women" sub="Lawn, chiffon, embroidered & more" />
        <CategoryTile to="/men" label="Men" sub="Cotton, wash-and-wear, khaddar" />
      </section>

      {/* Sale strip — only renders if there are active sale products */}
      {saleProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">On Sale</h2>
            <Link to="/sale" className="text-sm text-[#b5451b] hover:underline">
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

      {/* Trust / how it works */}
      <section className="max-w-6xl mx-auto px-4 py-14 border-t border-dashed border-[#d8cdb8] mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Step title="Browse" body="Explore fabric by category and find what suits you." />
          <Step title="Message us" body="Tap a product and send us a WhatsApp message." />
          <Step title="We confirm" body="We confirm availability and arrange delivery." />
        </div>
      </section>
    </StorefrontLayout>
  );
}

function CategoryTile({ to, label, sub }: { to: string; label: string; sub: string }) {
  return (
    <Link
      to={to}
      className="group relative aspect-[16/9] md:aspect-[4/3] bg-[#ece3d1] rounded-lg overflow-hidden border border-[#d8cdb8] flex items-end p-6"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#241f1a]/40 to-transparent" />
      <div className="relative text-[#f6f1e6]">
        <h3 className="font-serif text-3xl">{label}</h3>
        <p className="text-sm text-[#e5dcc8] mt-1">{sub}</p>
      </div>
    </Link>
  );
}

function Step({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-serif text-lg mb-1.5">{title}</h3>
      <p className="text-[#4a4237] text-sm">{body}</p>
    </div>
  );
}
