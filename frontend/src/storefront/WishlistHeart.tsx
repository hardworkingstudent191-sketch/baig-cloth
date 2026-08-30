import { useWishlisted } from "./wishlist";

export default function WishlistHeart({
  productId,
  productName,
  className = "",
}: {
  productId: number;
  productName: string;
  className?: string;
}) {
  const [saved, toggle] = useWishlisted(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        // ProductCard wraps this in a <Link> to the product page — without
        // stopping propagation, tapping the heart would also navigate.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`wishlist-heart${saved ? " is-saved" : ""} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
    >
      <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.7 1.6 5 5.1 4.1c2-.5 4 .3 5.2 2 .3.4.8.4 1.1 0 1.2-1.7 3.2-2.5 5.2-2 3.5.9 4.8 4.6 3.3 7.6C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
