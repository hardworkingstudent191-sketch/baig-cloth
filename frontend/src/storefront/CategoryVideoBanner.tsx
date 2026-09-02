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
    caption: "Every piece checked and trimmed by hand before it's ready",
  },
};

/**
 * Slim looping video strip at the top of a gender's category page — same
 * duotone-hero treatment as the homepage and About page, different footage
 * per gender (see credits below). Shown only on the unfiltered "All" view
 * (CategoryPage passes it conditionally): repeating it on every subcategory
 * chip click would make it wallpaper instead of a one-time first impression.
 *
 * The original pairing here was wrong on two counts, caught after launch:
 * the men's clip (pexels 8527273, "hands cutting fabric") visibly showed a
 * woman's hands (manicured nails, a ring) — mismatched for a men's category
 * page regardless of how the caption read. And the women's clip (pexels
 * 4870515, plain folded chiffon) never showed any embroidery at all despite
 * its caption promising "embroidered pieces" — caption and footage
 * disagreeing is worse than picking a plainer true caption. 8527273 moved to
 * women (a closer thematic fit, and the caption below no longer overclaims
 * what it shows); men now gets a real tailor at a cutting table instead.
 *
 * Credits (Pexels, free for commercial use, no attribution required):
 * - men: pexels.com/video/a-tailor-cutting-a-fabric-6766337
 * - women: pexels.com/video/a-close-up-of-a-person-s-hands-cutting-fabric-8527273
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
