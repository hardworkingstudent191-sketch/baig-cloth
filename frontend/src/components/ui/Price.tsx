import { formatPrice } from "../../lib/format";
import type { Product } from "../../lib/types";

export default function Price({ product, size = "sm", className = "" }: { product: Pick<Product, "price" | "sale_price" | "on_sale">; size?: "sm" | "lg"; className?: string }) {
  const onSale = product.on_sale && product.sale_price;
  const cls = size === "lg" ? "text-xl md:text-2xl" : "text-[14px]";
  return (
    <span className={`inline-flex items-baseline gap-2 ${cls} ${className}`}>
      {onSale ? (
        <>
          <span className="font-medium text-sale">{formatPrice(product.sale_price!)}</span>
          <span className="line-through text-muted text-[0.85em]">{formatPrice(product.price)}</span>
        </>
      ) : (
        <span className="font-medium">{formatPrice(product.price)}</span>
      )}
    </span>
  );
}
