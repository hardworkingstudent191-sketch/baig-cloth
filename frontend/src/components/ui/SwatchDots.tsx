import type { ProductVariant } from "../../lib/types";

/** Small colour dots for a product's variant family; shows up to `max` then "+N". */
export default function SwatchDots({ self, variants, max = 5, className = "" }: { self: { color_hex: string }; variants: ProductVariant[]; max?: number; className?: string }) {
  const all = [self, ...variants].filter((v) => v.color_hex);
  if (all.length < 2) return null;
  const shown = all.slice(0, max);
  const rest = all.length - shown.length;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`${all.length} colours`}>
      {shown.map((v, i) => (
        <span key={i} className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: v.color_hex }} />
      ))}
      {rest > 0 && <span className="text-[11px] text-muted ml-0.5">+{rest}</span>}
    </span>
  );
}
