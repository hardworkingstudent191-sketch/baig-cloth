import { useEffect, useState } from "react";
import { storefrontApi } from "./api";
import type { Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";
import { usePageMeta } from "../usePageMeta";
import Reveal from "../Reveal";
import SortSelect from "./SortSelect";
import { sortProducts, type SortOption } from "./sortProducts";

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");

  usePageMeta({
    title: "Sale",
    description:
      "Unstitched fabric currently on sale at Baig Cloth — reduced lawn, cotton, wash-and-wear and embroidered pieces for men and women.",
  });

  useEffect(() => {
    storefrontApi
      .listProducts({ on_sale: true })
      .then(setProducts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const sortedProducts = sortProducts(products, sort);

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-1 text-[#1a2f66]">Sale</h1>
        <p className="text-[#6b7280] text-sm mb-6">
          {products.length} {products.length === 1 ? "piece" : "pieces"} on sale right now
        </p>

        {products.length > 0 && (
          <div className="flex justify-end mb-4">
            <SortSelect value={sort} onChange={setSort} />
          </div>
        )}

        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937]">Couldn't load products. Check your connection and try again.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937]">No active sales right now — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sortedProducts.map((p, i) => (
              <Reveal key={p.id} delayMs={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
