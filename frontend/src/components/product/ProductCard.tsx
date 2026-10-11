import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useShop } from "../../lib/store";
import { imageSource } from "../../lib/images";
import { discountLabel } from "../../lib/format";
import type { Product } from "../../lib/types";
import Badge from "../ui/Badge";
import Price from "../ui/Price";
import SwatchDots from "../ui/SwatchDots";

/**
 * The card every listing is made of. 4:5 image with a slow zoom on hover
 * and a second-image crossfade when the product has one; badges top-left;
 * a 44 px heart target top-right; name, price and colour dots beneath.
 * `priority` marks above-the-fold cards so their images aren't lazy.
 */
export default function ProductCard({ product, priority = false, sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" }: { product: Product; priority?: boolean; sizes?: string }) {
  const toggle = useShop((s) => s.toggleWishlist);
  const saved = useShop((s) => s.wishlist.includes(product.id));
  const images = product.images.length ? product.images : product.image_urls.map((url) => ({ url }));
  const first = images[0] ? imageSource(images[0], 700, product.name) : null;
  const second = images[1] ? imageSource(images[1], 700, product.name) : null;
  const discount = discountLabel(product);

  return (
    <article className="group relative">
      <Link to={`/product/${product.id}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-bone">
          {first ? (
            <img
              src={first.src}
              srcSet={first.srcSet}
              sizes={sizes}
              width={first.width}
              height={first.height}
              alt={first.alt}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              className={`h-full w-full object-cover transition-transform duration-[1200ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.04] ${second ? "group-hover:opacity-0 transition-[transform,opacity] duration-700" : ""}`}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted text-xs">No photo yet</div>
          )}
          {second && (
            <img
              src={second.src}
              srcSet={second.srcSet}
              sizes={sizes}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.is_new && <Badge tone="ivory">New</Badge>}
            {discount && <Badge tone="sale">{discount}</Badge>}
            {!product.in_stock && <Badge tone="ink">Sold out</Badge>}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save"}
        className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full text-charcoal/80 hover:text-charcoal active:scale-90 transition-transform"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory/90 backdrop-blur-sm shadow-soft">
          <Heart size={16} strokeWidth={1.8} className={saved ? "fill-sale text-sale" : ""} />
        </span>
      </button>

      <div className="mt-3 space-y-1">
        <h3 className="text-[14px] leading-snug">
          <Link to={`/product/${product.id}`} className="hover:opacity-70 transition-opacity">{product.name}</Link>
        </h3>
        <div className="flex items-center justify-between gap-2">
          <Price product={product} />
          <SwatchDots self={product} variants={product.variants} />
        </div>
        {product.fabric && <p className="text-[12px] text-muted">{product.fabric}{product.pieces ? ` · ${product.pieces}-piece` : ""}</p>}
      </div>
    </article>
  );
}
