import type { Product } from "./types";

/** "3000.00" -> "Rs 3,000". Whole rupees; the catalog never uses paisa. */
export function formatPrice(value: string | number): string {
  const n = Math.round(Number(value));
  return `Rs ${n.toLocaleString("en-PK")}`;
}

/** The price the customer actually pays right now. */
export function effectivePrice(p: Pick<Product, "price" | "sale_price" | "on_sale">): number {
  return Number(p.on_sale && p.sale_price ? p.sale_price : p.price);
}

/** "-27%" style saving for a sale badge, or null when not on sale. */
export function discountLabel(p: Pick<Product, "price" | "sale_price" | "on_sale">): string | null {
  if (!p.on_sale || !p.sale_price) return null;
  const pct = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
  return pct > 0 ? `−${pct}%` : null;
}

/** "Shirt 3 m · Trouser 2.5 m · Dupatta 2.5 m" */
export function piecesLabel(p: Pick<Product, "pieces" | "piece_details">): string {
  if (p.piece_details.length) return p.piece_details.map((d) => `${d.name} ${d.meters} m`).join(" · ");
  return p.pieces ? `${p.pieces}-piece unstitched` : "";
}

/** URL-safe slug for category names: "Wash & Wear" -> "wash-wear" (matches the plugin's sanitize_title). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function clampText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
