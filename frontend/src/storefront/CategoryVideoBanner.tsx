import { useState } from "react";
import type { Gender } from "./types";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

const CONTENT: Record<Gender, { src: string; caption: string }> = {
  men: {
    src: "/hero/fabric-men.mp4",
    caption: "Cut and finished the same way it would be for a made-to-order piece",
  },
  women: {
    src: "/hero/fabric-women.mp4",
    caption: "Lawn and embroidered pieces, the way they actually drape",
  },
};

/**
 * Slim looping video strip at the top of a gender's category page — same
 * duotone-hero treatment as the homepage and About page, different footage
 * per gender (see credits below). Shown only on the unfiltered "All" view
 * (CategoryPage passes it conditionally): repeating it on every subcategory
 * chip click would make it wallpaper instead of a one-time first impression.
 *
 * Credits (Pexels, free for commercial use, no attribution required):
 * - men: pexels.com/video/a-close-up-of-a-person-s-hands-cutting-fabric-8527273
 * - women: pexels.com/video/close-up-look-of-a-fabric-cloth-4870515
 */
export default function CategoryVideoBanner({ gender }: { gender: Gender }) {
  const reducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const { src, caption } = CONTENT[gender];

  return (
    <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-lg overflow-hidden hero-weave mb-6">
      {!reducedMotion && (
        <video
          key={src}
          className={`hero-video${ready ? " is-ready" : ""}`}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setReady(true)}
        />
      )}
      <div className="hero-scrim" />
      <p className="hero-caption absolute bottom-3 left-4 right-4 md:text-sm text-xs text-[#e2e5ec] font-mono tracking-wide uppercase">
        {caption}
      </p>
    </div>
  );
}
