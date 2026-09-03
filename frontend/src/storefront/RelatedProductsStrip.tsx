import { useEffect, useState } from "react";
import { storefrontApi } from "./api";
import type { Product } from "./types";
import ProductCard from "./ProductCard";

/** Other in-stock pieces from the same category — cross-sell for someone who's already interested in this kind of fabric. */
export default function RelatedProductsStrip({
  categoryId,
  excludeId,
}: {
  categoryId: number;
  excludeId: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    storefrontApi
      .listProducts({ category_id: categoryId, limit: 9 })
      .then((all) => setProducts(all.filter((p) => p.id !== excludeId)))
      .catch(() => {});
  }, [categoryId, excludeId]);

  if (products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 border-t border-dashed border-[#dde1e8] mt-4">
      <h2 className="font-serif text-2xl mb-4">You Might Also Like</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <div key={p.id} className="w-40 shrink-0 md:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
