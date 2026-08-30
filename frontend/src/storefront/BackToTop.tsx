import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

/** Appears once the visitor has scrolled past one viewport height; jumps (or smooth-scrolls) back to the top of the page. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // A fixed pixel threshold, not a fraction of viewport height — on a page
    // shorter than one full viewport of extra scroll (e.g. Policies), a
    // window.innerHeight threshold is literally unreachable no matter how far
    // down the visitor scrolls, so the button could never appear at all.
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
      className={`back-to-top${visible ? " is-visible" : ""}`}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
