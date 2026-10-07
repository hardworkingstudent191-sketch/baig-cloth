import { useEffect, useRef, useState } from "react";
import { storefrontApi } from "./api";
import type { Product } from "./types";

// The full result set used to be fetched in one request with no cap beyond
// the API's own default (100) — fine at today's catalog size, but once any
// one filtered view (a category, the sale page, a search) crosses 100
// matches, the rest would just silently not exist as far as the storefront
// was concerned. This makes "there's more" explicit instead of invisible.
const PAGE_SIZE = 60;

type ListFilters = Parameters<typeof storefrontApi.listProducts>[0];

/**
 * Shared "load more" pagination for CategoryPage, SalePage and SearchPage —
 * they only differ in which filters they pass through.
 *
 * `enabled: false` clears the list and skips fetching entirely, for
 * SearchPage's "don't call the API for an empty query" case — a plain
 * `filters.search === undefined` can't express that, since an undefined
 * value is simply omitted from the request rather than meaning "fetch
 * nothing".
 */
export function usePaginatedProducts(filters: ListFilters, { enabled = true }: { enabled?: boolean } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const key = JSON.stringify(filters);
  // Bumped every time the filters change. A response that arrives after the
  // filters moved on (a slow request for the PREVIOUS filter finishing last)
  // must be dropped, or it overwrites the list for the current one — e.g.
  // /men/lawn briefly showing the whole men's catalog. Also guards loadMore.
  const generation = useRef(0);

  useEffect(() => {
    const gen = ++generation.current;
    if (!enabled) {
      setProducts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    storefrontApi
      .listProducts({ ...filters, limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (gen !== generation.current) return;
        setProducts(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch(() => {
        if (gen === generation.current) setError(true);
      })
      .finally(() => {
        if (gen === generation.current) setLoading(false);
      });
    // `filters` is intentionally represented by `key` (its JSON form) —
    // callers pass a fresh object literal every render, and diffing by
    // reference would refetch on every render instead of only when the
    // actual filter values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  function loadMore() {
    const gen = generation.current;
    setLoadingMore(true);
    storefrontApi
      .listProducts({ ...filters, limit: PAGE_SIZE, offset: products.length })
      .then((data) => {
        if (gen !== generation.current) return;
        setProducts((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch(() => {
        if (gen === generation.current) setError(true);
      })
      .finally(() => setLoadingMore(false));
  }

  return { products, loading, loadingMore, error, hasMore, loadMore };
}
