import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Fades + rises a block in the first time it enters the viewport.
 *
 * Deliberately NOT reused for the homepage hero — that already has its own
 * always-play entrance (hero-rise in storefront.css) timed against the
 * video load, not scroll position. This is for everything below the fold:
 * section headers and product grids, which shouldn't all be visible and
 * static the instant the page mounts.
 *
 * `once` via `unobserve`: it plays on first view and then leaves the
 * element alone, so scrolling back up past it doesn't replay the animation
 * every time — that reads as jittery on a long page, not "attractive".
 */
export default function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll${visible ? " is-visible" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
