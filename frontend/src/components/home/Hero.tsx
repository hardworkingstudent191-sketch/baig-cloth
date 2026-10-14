import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Slide } from "../../lib/types";
import { useDeferredMedia } from "../../lib/useDeferredMedia";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";
import { EASE } from "../../lib/motion";
import { RevealLines } from "../ui/Reveal";
import Img from "../ui/Img";
import { responsiveVideo } from "../../lib/images";

const AUTOPLAY_MS = 6500;

/**
 * Full-bleed hero: slides from wp-admin (video or image), auto-advancing,
 * swipeable on phones. Each slide's headline rises line by line when it
 * becomes active; images get a slow Ken Burns push; videos only mount after
 * the page's own assets have loaded (and never on save-data connections).
 */
export default function Hero({ slides }: { slides: Slide[] }) {
  const reduced = usePrefersReducedMotion();
  const mediaReady = useDeferredMedia();
  const [ref, embla] = useEmblaCarousel({ loop: slides.length > 1, duration: 28 }, slides.length > 1 && !reduced ? [Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: false, stopOnMouseEnter: true })] : []);
  const [index, setIndex] = useState(0);
  const saveData = typeof navigator !== "undefined" && "connection" in navigator && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const canVideo = mediaReady && !reduced && !saveData;

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);
  const goTo = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (slides.length === 0) return <FallbackHero />;

  return (
    <section className="relative -mt-[var(--header-h)] h-[92dvh] min-h-[560px] md:h-[88vh] md:min-h-[640px] bg-charcoal text-ivory overflow-hidden" aria-roledescription="carousel" aria-label="Featured">
      <div ref={ref} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div key={s.id} className="relative min-w-0 flex-[0_0_100%] h-full" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
              <SlideMedia slide={s} active={i === index} canVideo={canVideo} reduced={reduced} priority={i === 0} />
              <div className={`absolute inset-0 ${s.tone === "dark" ? "bg-gradient-to-t from-ivory/70 via-transparent to-ivory/20" : "bg-gradient-to-t from-ink/75 via-ink/15 to-ink/25"}`} />
              <div className={`absolute inset-x-0 bottom-0 gutter pb-[calc(var(--bottom-bar-h)+40px)] md:pb-20 ${s.tone === "dark" ? "text-charcoal" : "text-ivory"}`}>
                <AnimatePresence mode="wait">
                  {i === index && (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }} transition={{ duration: 0.4 }}>
                      {s.eyebrow && <p className={`eyebrow mb-4 ${s.tone === "dark" ? "text-charcoal/70" : "text-ivory/75"}`}>{s.eyebrow}</p>}
                      <h2 className="font-display text-[2.6rem] leading-[0.98] md:text-[4.6rem] lg:text-[5.4rem] max-w-4xl text-balance">
                        <RevealLines lines={splitHeadline(s.headline)} delay={0.1} />
                      </h2>
                      {s.subheadline && (
                        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.45 }} className={`mt-4 md:mt-5 max-w-xl text-[15px] md:text-lg text-pretty ${s.tone === "dark" ? "text-charcoal/80" : "text-ivory/85"}`}>
                          {s.subheadline}
                        </motion.p>
                      )}
                      {s.cta_label && s.cta_url && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.6 }} className="mt-6 md:mt-8">
                          <Link to={s.cta_url} className={`group inline-flex h-12 items-center gap-2 rounded-pill px-6 text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5 ${s.tone === "dark" ? "bg-charcoal text-ivory" : "bg-ivory text-charcoal"}`}>
                            {s.cta_label} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-[calc(var(--bottom-bar-h)+14px)] md:bottom-8 gutter flex items-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className="relative h-6 flex-1 max-w-16 md:max-w-20 flex items-center">
              <span className="block h-px w-full bg-ivory/35" />
              {i === index && (
                <motion.span key={`${s.id}-progress`} className="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-ivory origin-left w-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduced ? 0 : AUTOPLAY_MS / 1000, ease: "linear" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function splitHeadline(text: string): string[] {
  // Balance a long headline over two or three lines at natural word gaps.
  const words = text.split(/\s+/);
  if (words.length <= 3) return [text];
  const lines = words.length > 7 ? 3 : 2;
  const per = Math.ceil(words.length / lines);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out;
}

function SlideMedia({ slide, active, canVideo, reduced, priority }: { slide: Slide; active: boolean; canVideo: boolean; reduced: boolean; priority: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  const image = slide.image;
  const mobile = slide.image_mobile || slide.image;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slide.media_type === "video" && slide.video && canVideo ? (
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" poster={image || undefined} muted loop playsInline preload={priority ? "auto" : "metadata"} src={responsiveVideo(slide.video)} />
      ) : image ? (
        <motion.picture key={`${slide.id}-${active}`} className="absolute inset-0" initial={reduced ? false : { scale: 1.08 }} animate={{ scale: active && !reduced ? 1 : 1.08 }} transition={{ duration: 7, ease: "linear" }}>
          <source media="(max-width: 767px)" srcSet={mobile} />
          <Img src={image} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
        </motion.picture>
      ) : null}
      {/* Always underneath: the brand gradient shows if media is missing or still loading. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-charcoal via-navy-deep to-charcoal" />
      <div className="absolute inset-0 -z-10 opacity-[0.07] bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
    </div>
  );
}

/** Shown only if no slides exist yet in wp-admin — still a real hero, from the catalog's own footage. */
function FallbackHero() {
  const mediaReady = useDeferredMedia();
  const reduced = usePrefersReducedMotion();
  return (
    <section className="relative -mt-[var(--header-h)] h-[92dvh] min-h-[560px] md:h-[88vh] bg-charcoal text-ivory overflow-hidden">
      <video className="absolute inset-0 h-full w-full object-cover" poster="/hero/fabric-flow-poster.jpg" src={mediaReady && !reduced ? "/hero/fabric-flow.mp4" : undefined} autoPlay muted loop playsInline />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-ink/25" />
      <div className="absolute inset-x-0 bottom-0 gutter pb-[calc(var(--bottom-bar-h)+40px)] md:pb-20">
        <p className="eyebrow text-ivory/75 mb-4">Unstitched fabric</p>
        <h1 className="font-display text-[2.6rem] leading-[0.98] md:text-[4.6rem] max-w-4xl text-balance"><RevealLines lines={["Cloth worth cutting into", "something of your own."]} delay={0.1} /></h1>
        <div className="mt-8 flex gap-3">
          <Link to="/women" className="inline-flex h-12 items-center rounded-pill bg-ivory text-charcoal px-6 text-sm font-medium">Shop women</Link>
          <Link to="/men" className="inline-flex h-12 items-center rounded-pill border border-ivory/70 px-6 text-sm font-medium">Shop men</Link>
        </div>
      </div>
    </section>
  );
}
