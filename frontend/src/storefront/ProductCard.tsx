import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "./types";
import WishlistHeart from "./WishlistHeart";
import { imageSrcSet } from "../cloudinary";
import { whatsappLink } from "./api";
import { WHATSAPP_NUMBER } from "./config";

export default function ProductCard({ product }: { product: Product }) {
  const [loaded, setLoaded] = useState(false);
  const secondImage = product.image_urls[1];

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block relative"
    >
      <div className="relative aspect-[4/5] bg-[#eef0f3] rounded overflow-hidden border border-[#dde1e8] transition-all duration-300 group-hover:border-[#223c80]/30 group-hover:shadow-lg group-hover:shadow-[#101014]/5">
        {product.image_urls[0] ? (
          <img
            src={product.image_urls[0]}
            srcSet={imageSrcSet(product.image_urls[0], [300, 500, 800])}
            sizes="(min-width: 768px) 25vw, 50vw"
            width={1000}
            height={1250}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-[opacity,transform] duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            } ${secondImage ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6b7280] text-sm">
            No image
          </div>
        )}

        {/* A second product photo, if one exists, crossfades in on hover —
            shows more of the piece without an extra click. Absolutely
            positioned over the primary image rather than swapped in via
            state, so the transition is a pure CSS opacity fade with no
            flash or layout shift. */}
        {secondImage && (
          <img
            src={secondImage}
            srcSet={imageSrcSet(secondImage, [300, 500, 800])}
            sizes="(min-width: 768px) 25vw, 50vw"
            width={1000}
            height={1250}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {product.on_sale && (
          <span className="absolute top-2 left-2 bg-[#1a2f66] text-[#f7f7f5] text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm">
            Sale
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute inset-0 bg-[#101014]/50 flex items-center justify-center text-[#f7f7f5] text-xs uppercase tracking-wide">
            Out of stock
          </span>
        )}

        <WishlistHeart
          productId={product.id}
          productName={product.name}
          className="absolute top-2 right-2"
        />

        {/* Quick order action — reachable without opening the product page,
            for a visitor who already knows they want it. A <button> rather
            than an <a>: the whole card is already a <Link> (renders as
            <a>), and nesting an anchor inside an anchor is invalid HTML —
            same reason WishlistHeart above is a button, not a link. Opens
            the same wa.me URL via window.open instead. Desktop only,
            revealed on hover (or keyboard focus, via group-focus-within) so
            it doesn't compete with the image on first glance. `hidden` below
            md removes it from the DOM's tab order on touch entirely, rather
            than leaving an invisible-but-focusable control sitting on every
            mobile card — mobile ordering happens from the product page or
            the sticky bar there instead. */}
        {product.in_stock && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(whatsappLink(product, WHATSAPP_NUMBER), "_blank", "noopener,noreferrer");
            }}
            aria-label={`Order ${product.name} on WhatsApp`}
            className="hidden md:flex quick-order-cta absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 bg-[#101014] text-[#f7f7f5] text-xs px-3 py-1.5 rounded-full opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 hover:bg-[#223c80]"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.26-3.45-.72-2.91-1.17-4.78-4.08-4.93-4.27-.15-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.43.27-.3.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.19-.15.31-.3.48-.15.17-.31.37-.44.5-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.17-.2.73-.85.93-1.14.19-.3.39-.24.65-.15.27.1 1.7.8 1.99.95.3.15.5.22.57.34.07.13.07.75-.17 1.43z" />
            </svg>
            Order
          </button>
        )}

        {/* Selvage notch — signature detail */}
        <div className="absolute bottom-0 left-0 right-0 h-2 border-t border-dashed border-[#dde1e8]/70" />
      </div>

      <div className="mt-2.5">
        <p className="text-sm transition-colors group-hover:text-[#223c80]">{product.name}</p>
        <p className="font-mono text-xs mt-0.5">
          {product.on_sale && product.sale_price ? (
            <>
              <span className="line-through text-[#6b7280] mr-1.5">Rs {product.price}</span>
              <span className="text-[#1a2f66]">Rs {product.sale_price}</span>
            </>
          ) : (
            <span>Rs {product.price}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
