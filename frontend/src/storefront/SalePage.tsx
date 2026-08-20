import { useEffect, useState } from "react";
import { storefrontApi } from "./api";
import type { Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storefrontApi
      .listProducts({ on_sale: true })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-1 text-[#b5451b]">Sale</h1>
        <p className="text-[#a9987e] text-sm mb-6">
          {products.length} {products.length === 1 ? "piece" : "pieces"} on sale right now
        </p>

        {loading ? (
          <p className="text-[#a9987e] text-sm">Loading…</p>
        ) : products.length === 0 ? (
          <div className="border border-dashed border-[#d8cdb8] rounded-lg p-12 text-center">
            <p className="text-[#4a4237]">No active sales right now — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
