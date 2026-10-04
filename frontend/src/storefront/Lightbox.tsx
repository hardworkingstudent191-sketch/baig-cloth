import { useEffect, useRef } from "react";
import type { TouchEvent } from "react";
import { imageSrcSet } from "../cloudinary";

const SWIPE_THRESHOLD_PX = 50;

/**
 * Full-screen zoomed view of the product gallery. Arrow keys and Escape
 * work without needing a mouse; clicking the backdrop closes it same as the
 * explicit close button, matching how most native image viewers behave.
 * Touch swipe left/right moves through the gallery the same as the arrow
 * buttons — the primary way this is actually used on a phone.
 */
export default function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt,
}: {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || images.length < 2) {
      touchStartX.current = null;
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) onIndexChange((index + 1) % images.length);
    else onIndexChange((index - 1 + images.length) % images.length);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", onKeyDown);
    // Prevent the page behind the lightbox from scrolling while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length, onIndexChange, onClose]);

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — enlarged image`}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={onClose}
        className="lightbox-close absolute top-4 right-4 w-11 h-11"
        aria-label="Close"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + images.length) % images.length);
          }}
          className="lightbox-nav absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11"
          aria-label="Previous image"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* key={index}: a cheap remount (just an <img>, no data fetch behind
          it) so the crossfade-in animation replays on every prev/next click
          instead of just once on the very first open. */}
      <img
        key={index}
        src={images[index]}
        srcSet={imageSrcSet(images[index], [600, 900, 1400])}
        sizes="90vw"
        alt={alt}
        className="lightbox-image lightbox-image-enter"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index + 1) % images.length);
          }}
          className="lightbox-nav absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11"
          aria-label="Next image"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
