import { Link } from "react-router-dom";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";
import { useWishlistIds } from "./wishlist";
import { useProductsByIds } from "./useProductsByIds";
import { usePageMeta } from "../usePageMeta";
import Reveal from "../Reveal";

export default function WishlistPage() {
  const ids = useWishlistIds();
  const { products, loading } = useProductsByIds(ids);

  usePageMeta({
    title: "Wishlist",
    description: "Fabric you've saved at Baig Cloth, kept on this device.",
    noindex: true, // personal, per-device list — nothing here is worth a search result
  });

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-1">Wishlist</h1>
        <p className="text-[#6b7280] text-sm mb-6">
          Saved on this device — tap the heart on any piece to add or remove it.
        </p>

        {loading ? (
          <ProductGridSkeleton count={ids.length || 4} />
        ) : products.length === 0 ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937] mb-3">Nothing saved yet.</p>
            <Link to="/" className="text-[#223c80] text-sm hover:underline">
              Browse the catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p, i) => (
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
