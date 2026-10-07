import ProductCard from "./ProductCard";
import { useProductsByIds } from "./useProductsByIds";
import { getRecentlyViewed, pruneRecentlyViewed } from "./recentlyViewed";
import Reveal from "../Reveal";

export default function RecentlyViewedStrip({ excludeId }: { excludeId: number }) {
  const ids = getRecentlyViewed(excludeId);
  const { products } = useProductsByIds(ids, pruneRecentlyViewed);

  if (products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 border-t border-dashed border-[#dde1e8] mt-4">
      <h2 className="font-serif text-2xl mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
        {products.slice(0, 8).map((p, i) => (
          <Reveal key={p.id} delayMs={(i % 4) * 60} className="w-40 shrink-0 md:w-auto">
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
