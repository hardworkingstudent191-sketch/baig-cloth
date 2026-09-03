import { useEffect, useState, type RefObject } from "react";
import { whatsappLink } from "./api";
import { WHATSAPP_NUMBER } from "./config";
import type { Product } from "./types";

/**
 * Fixed bottom order bar, mobile only. Appears once the main "Order on
 * WhatsApp" button (in the details column) scrolls out of view — on a long
 * description the primary CTA can end up well above the fold, so this keeps
 * ordering one tap away no matter how far the visitor has scrolled.
 */
export default function MobileOrderBar({
  product,
  watchRef,
}: {
  product: Product;
  watchRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  if (!product.in_stock) return null;

  return (
    <div
      className={`mobile-order-bar md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f7f7f5]/97 backdrop-blur border-t border-[#dde1e8] px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm truncate">{product.name}</p>
        <p className="font-mono text-xs">
          {product.on_sale && product.sale_price ? (
            <span className="text-[#1a2f66]">Rs {product.sale_price}</span>
          ) : (
            <span>Rs {product.price}</span>
          )}
        </p>
      </div>
      <a
        href={whatsappLink(product, WHATSAPP_NUMBER)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 bg-[#223c80] text-[#f7f7f5] px-5 py-2.5 rounded text-sm font-medium hover:bg-[#2d4d9e] transition-colors"
      >
        Order
      </a>
    </div>
  );
}
