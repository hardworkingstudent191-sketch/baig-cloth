import { useEffect, useState } from "react";
import { storefrontApi } from "./api";
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
 */
export function useProductsByIds(ids: number[]): { products: Product[]; loading: boolean } {
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
    Promise.all(ids.map((id) => storefrontApi.getProduct(id).catch(() => null))).then((results) => {
      if (cancelled) return;
      setProducts(results.filter((p): p is Product => p !== null));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { products, loading };
}
