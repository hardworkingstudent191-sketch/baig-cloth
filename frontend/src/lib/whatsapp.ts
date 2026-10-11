import type { Product } from "./types";
import { effectivePrice, formatPrice } from "./format";

/**
 * Pre-written WhatsApp messages. wa.me opens the app on phones and WhatsApp
 * Web/Desktop on computers; the text is pre-filled so the customer only has
 * to press send. Product links use the storefront's own URL — crawlers get a
 * per-product preview via the share endpoint (see .htaccess).
 */

function productUrl(id: number): string {
  return `${window.location.origin}/product/${id}`;
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function singleProductMessage(p: Product): string {
  const colour = p.color ? ` (${p.color})` : "";
  return `Assalam o Alaikum! I'm interested in "${p.name}"${colour} — ${formatPrice(effectivePrice(p))}.\n${productUrl(p.id)}\n\nIs it available?`;
}

export interface BagLine {
  product: Product;
  qty: number;
}

export function bagMessage(lines: BagLine[]): string {
  const rows = lines.map((l, i) => {
    const colour = l.product.color ? ` (${l.product.color})` : "";
    const qty = l.qty > 1 ? ` × ${l.qty}` : "";
    return `${i + 1}. ${l.product.name}${colour}${qty} — ${formatPrice(effectivePrice(l.product) * l.qty)}\n   ${productUrl(l.product.id)}`;
  });
  const total = lines.reduce((sum, l) => sum + effectivePrice(l.product) * l.qty, 0);
  return `Assalam o Alaikum! I'd like to order:\n\n${rows.join("\n")}\n\nTotal: ${formatPrice(total)}\n\nPlease confirm availability and delivery.`;
}

export function generalEnquiryMessage(): string {
  return "Assalam o Alaikum! I have a question about your fabric.";
}
