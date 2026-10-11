import type { ReactNode } from "react";

export default function Badge({ children, tone = "ink", className = "" }: { children: ReactNode; tone?: "ink" | "sale" | "ivory" | "navy"; className?: string }) {
  const tones = {
    ink: "bg-charcoal text-ivory",
    sale: "bg-sale text-ivory",
    ivory: "bg-ivory/95 text-charcoal",
    navy: "bg-navy text-ivory",
  };
  return <span className={`inline-block rounded-sm px-2 py-1 text-[10px] font-medium tracking-[0.14em] uppercase ${tones[tone]} ${className}`}>{children}</span>;
}
