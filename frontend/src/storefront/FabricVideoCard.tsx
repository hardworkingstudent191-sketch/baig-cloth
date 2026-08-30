import { useState } from "react";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

/**
 * Contained, rounded reuse of the homepage's fabric footage — same asset,
 * same duotone-gradient fallback treatment, just scaled down to sit inline
 * in a text page instead of running full-bleed behind a hero. Keeping it to
 * one already-licensed clip (see the credit in HomePage.tsx) rather than
 * sourcing a second one for a single small card on a low-traffic page.
 */
export default function FabricVideoCard({ className = "" }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden hero-weave ${className}`}>
      {!reducedMotion && (
        <video
          className={`hero-video${ready ? " is-ready" : ""}`}
          src="/hero/fabric-flow.mp4"
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setReady(true)}
        />
      )}
      <div className="hero-scrim" />
      <p className="hero-content absolute bottom-3 left-4 right-4 text-[#e2e5ec] text-xs font-mono tracking-wide uppercase">
        Real fabric, hand-picked before it ever reaches the catalog
      </p>
    </div>
  );
}
