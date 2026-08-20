import { Link } from "react-router-dom";
import type { Product } from "./types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block relative"
    >
      <div className="relative aspect-[4/5] bg-[#ece3d1] rounded overflow-hidden border border-[#d8cdb8]">
        {product.image_urls[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#a9987e] text-sm">
            No image
          </div>
        )}

        {product.on_sale && (
          <span className="absolute top-2 left-2 bg-[#b5451b] text-[#f6f1e6] text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm">
            Sale
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute inset-0 bg-[#241f1a]/50 flex items-center justify-center text-[#f6f1e6] text-xs uppercase tracking-wide">
            Out of stock
          </span>
        )}

        {/* Selvage notch — signature detail */}
        <div className="absolute bottom-0 left-0 right-0 h-2 border-t border-dashed border-[#d8cdb8]/70" />
      </div>

      <div className="mt-2.5">
        <p className="text-sm">{product.name}</p>
        <p className="font-mono text-xs mt-0.5">
          {product.on_sale && product.sale_price ? (
            <>
              <span className="line-through text-[#a9987e] mr-1.5">Rs {product.price}</span>
              <span className="text-[#b5451b]">Rs {product.sale_price}</span>
            </>
          ) : (
            <span>Rs {product.price}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
