import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useProducts } from "../../lib/useFetch";
import type { ProductFilters, SortOption } from "../../lib/types";
import ProductGrid from "./ProductGrid";
import { ProductGridSkeleton } from "../ui/Skeleton";
import ErrorState, { EmptyState } from "../ui/ErrorState";
import { Button } from "../ui/Button";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name: "Name A–Z",
};

export function SortSelect({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  return (
    <label className="relative inline-flex items-center text-sm">
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none bg-transparent border border-line rounded-pill pl-4 pr-9 h-10 text-sm hover:border-charcoal/50 focus:border-charcoal outline-none"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
          <option key={k} value={k}>{SORT_LABELS[k]}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" />
    </label>
  );
}

/**
 * The listing body shared by category, sale, new, search and collection
 * pages: loading skeleton, error with retry, empty state, grid, load more.
 */
export default function Listing({
  filters,
  enabled = true,
  emptyTitle = "Nothing here yet",
  emptyBody,
  emptyAction,
  toolbar,
  onTotal,
}: {
  filters: ProductFilters;
  enabled?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  toolbar?: (total: number | null) => ReactNode;
  onTotal?: (total: number | null) => void;
}) {
  const { products, total, loading, loadingMore, error, hasMore, loadMore, reload } = useProducts(filters, enabled);
  if (onTotal && !loading) onTotal(total);

  return (
    <div>
      {toolbar && <div className="mb-5 md:mb-8">{toolbar(loading ? null : total)}</div>}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
      ) : (
        <>
          <ProductGrid products={products} />
          {hasMore && (
            <div className="mt-10 md:mt-14 flex flex-col items-center gap-3">
              <p className="text-xs text-muted">Showing {products.length}{total !== null ? ` of ${total}` : ""}</p>
              <Button variant="secondary" size="lg" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
