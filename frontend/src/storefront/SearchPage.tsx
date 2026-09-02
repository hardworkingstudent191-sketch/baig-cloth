import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";
import { usePageMeta } from "../usePageMeta";
import Reveal from "../Reveal";
import SortSelect from "./SortSelect";
import { sortProducts, type SortOption } from "./sortProducts";
import { usePaginatedProducts } from "./usePaginatedProducts";
import LoadMoreButton from "./LoadMoreButton";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [sort, setSort] = useState<SortOption>("newest");

  const { products, loading, loadingMore, error, hasMore, loadMore } = usePaginatedProducts(
    { search: query },
    { enabled: query.trim().length > 0 },
  );

  // noindex: search result pages are duplicate views of the catalog, and an
  // unbounded ?q= space is exactly the kind of thing that bloats an index.
  usePageMeta({
    title: query.trim() ? `Search: ${query.trim()}` : "Search",
    description: "Search the Baig Cloth catalog of unstitched fabric for men and women.",
    noindex: true,
  });

  const sortedProducts = sortProducts(products, sort);

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-1">Search</h1>
        <p className="text-[#6b7280] text-sm mb-6">
          {query.trim() ? (
            <>
              {products.length}
              {hasMore ? "+" : ""} {products.length === 1 && !hasMore ? "result" : "results"} for "{query}"
            </>
          ) : (
            "Type something in the search box to find a piece."
          )}
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
            <p className="text-[#1f2937]">Couldn't search right now. Check your connection and try again.</p>
          </div>
        ) : query.trim() && products.length === 0 ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937]">No pieces match "{query}". Try a different word.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedProducts.map((p, i) => (
                <Reveal key={p.id} delayMs={(i % 4) * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
            {hasMore && (
              <LoadMoreButton onClick={loadMore} loading={loadingMore} shownCount={products.length} />
            )}
          </>
        )}
      </div>
    </StorefrontLayout>
  );
}
