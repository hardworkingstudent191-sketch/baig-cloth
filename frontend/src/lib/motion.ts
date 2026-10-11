import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * One motion vocabulary for the whole site, so every reveal, hover and page
 * transition shares the same feel:
 *   - easeOutExpo for things entering (fast start, long settle)
 *   - durations: fast 0.24 s (hover/tap), base 0.6 s (reveals), slow 1.1 s (hero/cinematic)
 *   - reduced motion: everything collapses to instant/opacity-only
 */
export const EASE = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  inOutQuart: [0.76, 0, 0.24, 1] as const,
};
export const DUR = { fast: 0.24, base: 0.6, slow: 1.1 };

/** Framer-style transition presets for the `motion` package. */
export const transitions = {
  fast: { duration: DUR.fast, ease: EASE.outQuart },
  base: { duration: DUR.base, ease: EASE.outExpo },
  slow: { duration: DUR.slow, ease: EASE.outExpo },
};

/**
 * Smooth scrolling (Lenis) wired to GSAP's ticker so ScrollTrigger stays in
 * sync. Disabled when the visitor prefers reduced motion or on coarse-pointer
 * devices (native momentum scrolling on phones is better than any library).
 */
export function useSmoothScroll(): void {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reduced]);
}

/** Scroll to top instantly on route change (Lenis-aware). */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "auto" });
}

export { gsap, ScrollTrigger };
