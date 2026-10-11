import { motion } from "motion/react";
import type { Product } from "../../lib/types";
import ProductCard from "./ProductCard";
import { rise, stagger } from "../ui/Reveal";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";

/** 2 columns on phones, 3 from md, 4 from lg; cards stagger in as the grid enters view. */
export default function ProductGrid({ products, priorityCount = 4, columns = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" }: { products: Product[]; priorityCount?: number; columns?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.ul
      className={`grid ${columns} gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12`}
      variants={reduced ? undefined : stagger}
      initial={reduced ? undefined : "hidden"}
      whileInView={reduced ? undefined : "show"}
      viewport={{ once: true, amount: 0.05 }}
    >
      {products.map((p, i) => (
        <motion.li key={p.id} variants={reduced ? undefined : rise}>
          <ProductCard product={p} priority={i < priorityCount} />
        </motion.li>
      ))}
    </motion.ul>
  );
}

/** Horizontal rail for phones (snap-scroll), grid on desktop — used for "New in", related products, recently viewed. */
export function ProductRail({ products, priorityCount = 2 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-[var(--page-gutter)] px-[var(--page-gutter)] md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible">
      {products.map((p, i) => (
        <li key={p.id} className="w-[68vw] sm:w-[44vw] md:w-auto shrink-0 snap-start">
          <ProductCard product={p} priority={i < priorityCount} sizes="(min-width: 768px) 25vw, 68vw" />
        </li>
      ))}
    </ul>
  );
}
