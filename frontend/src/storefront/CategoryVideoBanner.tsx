import { useState } from "react";
import type { Gender } from "./types";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

const CONTENT: Record<Gender, { src: string; caption: string }> = {
  men: {
    src: "/hero/fabric-men.mp4",
    caption: "The weave and texture of real cotton and khaddar",
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
 * Went through two corrections after launch, both caught by real feedback:
 *
 * 1. The original men's clip (pexels 8527273, "hands cutting fabric")
 *    visibly showed a woman's hands (manicured nails, a ring) — mismatched
 *    regardless of caption. Moved to women, a genuine thematic fit.
 * 2. Its replacement — a Western tailoring studio (waistcoat, mannequins,
 *    an elderly tailor at a cutting table) — didn't represent this shop's
 *    actual context (unstitched cotton/wash-and-wear/khaddar for South
 *    Asian dress, not Western bespoke suiting), and reaching for footage
 *    that specifically depicted "traditional Pakistani menswear" risked
 *    picking something else subtly wrong rather than getting it right.
 *    Landed on a plain woven fabric texture instead — no people, no
 *    culturally-specific styling to get wrong, and the olive-khaki color
 *    actually matches the shop's own wash-and-wear palette (rust, sage,
 *    olive) already in the catalog.
 *
 * Both video cards also switched from `.hero-scrim` (a full-frame 32-60%
 * darkening gradient, right for the homepage hero's large centered
 * headline) to `.hero-scrim-bottom` (fully transparent over most of the
 * frame, darkened only behind the caption) — the heavier scrim was making
 * these smaller cards look muddy/underexposed for no reason, since neither
 * has text anywhere but a one-line caption at the bottom edge.
 *
 * Credits (Pexels, free for commercial use, no attribution required):
 * - men: pexels.com/video/close-up-video-of-a-cloth-7793207
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
      <div className="hero-scrim-bottom" />
      <p className="hero-caption absolute bottom-3 left-4 right-4 md:text-sm text-xs text-[#e2e5ec] font-mono tracking-wide uppercase">
        {caption}
      </p>
    </div>
  );
}
