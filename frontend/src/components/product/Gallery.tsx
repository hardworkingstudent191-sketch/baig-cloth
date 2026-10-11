import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { imageSource } from "../../lib/images";
import type { ProductImage } from "../../lib/types";
import Badge from "../ui/Badge";

/**
 * Product gallery. Phones: one swipeable 4:5 image at a time with a
 * counter; desktop: a two-column stack of large images. Tapping opens the
 * lightbox (swipe, arrows, double-tap to zoom).
 */
export default function Gallery({ images, name, badges }: { images: ProductImage[]; name: string; badges?: React.ReactNode }) {
  const [ref, embla] = useEmblaCarousel({ loop: images.length > 1, align: "start" });
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  if (images.length === 0) {
    return <div className="aspect-[4/5] bg-bone rounded-card grid place-items-center text-muted text-sm">Photos coming soon</div>;
  }

  return (
    <>
      {/* Phone: carousel */}
      <div className="md:hidden relative -mx-[var(--page-gutter)]">
        <div ref={ref} className="overflow-hidden">
          <div className="flex">
            {images.map((img, i) => {
              const src = imageSource(img, 1000, `${name} — photo ${i + 1}`);
              return (
                <button key={i} type="button" onClick={() => setLightbox(i)} className="min-w-0 flex-[0_0_100%] aspect-[4/5] bg-bone" aria-label="Open photo">
                  <img src={src.src} srcSet={src.srcSet} sizes="100vw" width={src.width} height={src.height} alt={src.alt} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="absolute left-4 top-4 flex flex-col gap-1">{badges}</div>
        {images.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-ivory" : "w-1.5 bg-ivory/60"}`} />
            ))}
          </div>
        )}
        <span className="absolute right-3 bottom-3 rounded-pill bg-ink/50 text-ivory text-[11px] px-2 py-1 tabular-nums">{index + 1} / {images.length}</span>
      </div>

      {/* Desktop: stacked */}
      <div className="hidden md:grid grid-cols-2 gap-3">
        {images.map((img, i) => {
          const src = imageSource(img, 1000, `${name} — photo ${i + 1}`);
          const single = images.length === 1;
          return (
            <button key={i} type="button" onClick={() => setLightbox(i)} className={`group relative aspect-[4/5] overflow-hidden rounded-card bg-bone ${single || (i === 0 && images.length % 2 === 1) ? "col-span-2 aspect-[4/5] max-h-[80vh]" : ""}`} aria-label="Open photo">
              <img src={src.src} srcSet={src.srcSet} sizes="(min-width: 1280px) 45vw, 50vw" width={src.width} height={src.height} alt={src.alt} loading={i < 2 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" className="h-full w-full object-cover transition-transform duration-[1200ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.03]" />
              {i === 0 && <div className="absolute left-4 top-4 flex flex-col gap-1">{badges}</div>}
              <span className="absolute right-3 bottom-3 grid h-9 w-9 place-items-center rounded-full bg-ivory/90 text-charcoal opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={16} /></span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>{lightbox !== null && <Lightbox images={images} name={name} start={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
    </>
  );
}

function Lightbox({ images, name, start, onClose }: { images: ProductImage[]; name: string; start: number; onClose: () => void }) {
  const [ref, embla] = useEmblaCarousel({ loop: images.length > 1, startIndex: start });
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => {
      setIndex(embla.selectedScrollSnap());
      setZoomed(false);
    };
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") embla?.scrollNext();
      if (e.key === "ArrowLeft") embla?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [embla, onClose]);

  const toggleZoom = useCallback(() => setZoomed((z) => !z), []);

  return (
    <motion.div className="fixed inset-0 z-[60] bg-ink text-ivory flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <span className="text-sm tabular-nums text-ivory/70">{index + 1} / {images.length}</span>
        <button type="button" onClick={onClose} className="p-2 -mr-2" aria-label="Close"><X size={24} strokeWidth={1.5} /></button>
      </div>
      <div ref={ref} className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {images.map((img, i) => {
            const src = imageSource(img, 1600, `${name} — photo ${i + 1}`);
            return (
              <div key={i} className="min-w-0 flex-[0_0_100%] h-full grid place-items-center overflow-hidden" onDoubleClick={toggleZoom}>
                <img src={src.src} srcSet={src.srcSet} sizes="100vw" alt={src.alt} className={`max-h-full max-w-full object-contain transition-transform duration-300 ${zoomed && i === index ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in"}`} onClick={() => i === index && window.matchMedia("(pointer: fine)").matches && toggleZoom()} draggable={false} />
              </div>
            );
          })}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => embla?.scrollPrev()} className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20" aria-label="Previous photo"><ChevronLeft /></button>
          <button type="button" onClick={() => embla?.scrollNext()} className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20" aria-label="Next photo"><ChevronRight /></button>
        </>
      )}
      <p className="text-center text-xs text-ivory/50 pb-4 md:hidden">Swipe · double-tap to zoom</p>
    </motion.div>
  );
}

export { Badge };
