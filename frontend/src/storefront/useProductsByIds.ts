import { useEffect, useState } from "react";
import { storefrontApi, ApiError } from "./api";
import type { Product } from "./types";

/**
 * Resolves a list of product ids (from the wishlist or recently-viewed
 * localStorage lists) into full Product objects, in the same order.
 *
 * There's no "get many by id" endpoint, so this fires one GET per id — fine
 * at the list sizes these features actually produce (a wishlist or
 * recently-viewed history capped at a handful of items, not hundreds).
 * A product that's since been deleted from the catalog is simply dropped
 * rather than surfaced as an error — a stale id sitting in someone's
 * localStorage from weeks ago shouldn't show a broken card.
 *
 * `onMissing` receives the ids the API answered with a definite 404 (and ONLY
 * those — a network error or 5xx says nothing about whether the product still
 * exists), so callers can prune them from storage.
 */
export function useProductsByIds(
  ids: number[],
  onMissing?: (missingIds: number[]) => void,
): { products: Product[]; loading: boolean } {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const key = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const missing: number[] = [];
    Promise.all(
      ids.map((id) =>
        storefrontApi.getProduct(id).catch((err) => {
          if (err instanceof ApiError && err.status === 404) missing.push(id);
          return null;
        }),
      ),
    ).then((results) => {
      if (cancelled) return;
      setProducts(results.filter((p): p is Product => p !== null));
      setLoading(false);
      if (missing.length > 0) onMissing?.(missing);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { products, loading };
}
