import { useEffect, useState } from "react";

/**
 * Returns false until the page's own critical resources have finished
 * loading (the `load` event), then true.
 *
 * Used to gate the hero <video> elements: an autoplaying video begins
 * downloading the moment it's in the DOM, whatever `preload` says, and on a
 * slow mobile connection those bytes compete directly with the CSS, fonts
 * and product images that make the page usable. Mounting the video only
 * after `load` means the poster image (a ~50KB JPEG, rendered immediately)
 * is what the visitor sees first, and the footage arrives as an upgrade
 * rather than a prerequisite. If `load` has already fired (client-side
 * navigation to a page with a video), this resolves on the next tick.
 */
export function useDeferredMedia(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") {
      const t = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(t);
    }
    const onLoad = () => setReady(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return ready;
}
