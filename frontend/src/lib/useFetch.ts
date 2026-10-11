import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "./api";
import type { Product, ProductFilters } from "./types";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** True when the error was a definite 404 (not a network failure). */
  notFound: boolean;
  reload: () => void;
}

/**
 * Fetch-on-mount with cancellation: when `key` changes (or the component
 * unmounts) the in-flight request is aborted, so a slow response for the
 * previous key can never overwrite the current one.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, key: string, enabled = true): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError(0, String(err)));
        setLoading(false);
      });
    return () => controller.abort();
    // `key` stands in for the fetcher's inputs; the fetcher closure itself is fresh every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  return { data, loading, error, notFound: error?.status === 404, reload: () => setTick((t) => t + 1) };
}

export const PAGE_SIZE = 24;

export interface PagedProducts {
  products: Product[];
  total: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/** Paginated product listing with "load more"; superseded responses are dropped. */
export function useProducts(filters: ProductFilters, enabled = true): PagedProducts {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [tick, setTick] = useState(0);
  const generation = useRef(0);
  const key = JSON.stringify(filters);

  useEffect(() => {
    const gen = ++generation.current;
    const controller = new AbortController();
    if (!enabled) {
      setProducts([]);
      setTotal(null);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .products({ ...filters, limit: PAGE_SIZE, offset: 0 }, controller.signal)
      .then((r) => {
        if (gen !== generation.current) return;
        setProducts(r.items);
        setTotal(r.total);
        setHasMore(r.total !== null ? r.items.length < r.total : r.items.length === PAGE_SIZE);
        setLoading(false);
      })
      .catch((err) => {
        if (gen !== generation.current || controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError(0, String(err)));
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  function loadMore() {
    const gen = generation.current;
    setLoadingMore(true);
    api
      .products({ ...filters, limit: PAGE_SIZE, offset: products.length })
      .then((r) => {
        if (gen !== generation.current) return;
        setProducts((prev) => [...prev, ...r.items]);
        setHasMore(r.total !== null ? products.length + r.items.length < r.total : r.items.length === PAGE_SIZE);
      })
      .catch((err) => {
        if (gen === generation.current) setError(err instanceof ApiError ? err : new ApiError(0, String(err)));
      })
      .finally(() => setLoadingMore(false));
  }

  return { products, total, loading, loadingMore, error, hasMore, loadMore, reload: () => setTick((t) => t + 1) };
}
