import { useEffect, useMemo } from "react";
import { useShop } from "../lib/store";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import PageHeader from "../components/ui/PageHeader";
import ProductGrid from "../components/product/ProductGrid";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import ErrorState, { EmptyState } from "../components/ui/ErrorState";
import { ButtonLink } from "../components/ui/Button";

export default function SavedPage() {
  const wishlist = useShop((s) => s.wishlist);
  const prune = useShop((s) => s.pruneMissing);
  const ids = useMemo(() => [...wishlist].reverse(), [wishlist]);
  const { data, loading, error, reload } = useFetch((signal) => api.productsByIds(ids, signal), ids.join(","), ids.length > 0);
  usePageMeta({ title: "Saved", description: "Pieces you've saved at Baig Cloth, kept on this device.", noindex: true });

  useEffect(() => {
    if (!data || loading) return;
    const have = new Set(data.map((p) => p.id));
    const missing = ids.filter((id) => !have.has(id));
    if (missing.length) prune(missing);
  }, [data, loading, ids, prune]);

  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Saved" }]} eyebrow="On this device" title="Saved pieces" intro="Tap the heart on any piece to keep it here. Nothing is sent anywhere — it's just for you." />
      <div className="gutter">
        {ids.length === 0 ? (
          <EmptyState title="Nothing saved yet" body="Browse the collection and tap the heart on pieces you like." action={<ButtonLink to="/women" variant="secondary">Start browsing</ButtonLink>} />
        ) : loading && !data ? (
          <ProductGridSkeleton count={Math.min(8, ids.length)} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data && data.length > 0 ? (
          <ProductGrid products={data} />
        ) : (
          <EmptyState title="Those pieces are gone" body="Everything you'd saved has since left the catalog." />
        )}
      </div>
    </div>
  );
}
