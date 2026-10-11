import { useEffect, useState } from "react";

/**
 * Single source of truth for the reduced-motion check.
 *
 * Previously duplicated inline in HomePage.tsx for the hero video; every
 * other animation added since (scroll reveals, the back-to-top button)
 * needs the same check, so it's factored out here rather than re-copied.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
