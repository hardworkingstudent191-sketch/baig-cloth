import type { Product } from "./types";

export type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A–Z",
};

function effectivePrice(p: Product): number {
  return Number(p.on_sale && p.sale_price ? p.sale_price : p.price);
}

/**
 * Client-side sort over an already-fetched product list. The API's default
 * order (newest created first) already covers "newest", so there's no
 * backend round-trip for any of these — the full filtered list is already
 * in hand from the existing listProducts() call.
 */
export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price-desc":
      return sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return sorted; // already newest-first from the API
  }
}
