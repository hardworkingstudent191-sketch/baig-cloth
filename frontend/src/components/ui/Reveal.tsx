import { motion, type Variants } from "motion/react";
import { type ReactNode } from "react";
import { EASE } from "../../lib/motion";
import { usePrefersReducedMotion } from "../../lib/usePrefersReducedMotion";

/**
 * Scroll-triggered rise-and-fade, played once. Elements stagger when given
 * a `delay` (seconds). With reduced motion the content simply appears.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
  as = "div",
  once = true,
  amount = 0.2,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span" | "header" | "p";
  once?: boolean;
  amount?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const Tag = motion[as];
  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, ease: EASE.outExpo, delay }}
    >
      {children}
    </Tag>
  );
}

/** Variants for parent/child stagger: wrap a list in <motion.ul variants={stagger}> and items in <motion.li variants={rise}>. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE.outExpo } },
};

/**
 * Line-by-line text reveal: each line slides up from behind a clip mask —
 * the editorial headline treatment. Pass lines as an array of strings.
 */
export function RevealLines({ lines, className = "", delay = 0, lineClassName = "" }: { lines: string[]; className?: string; delay?: number; lineClassName?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <span className={`block ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="block clip">
          <motion.span
            className={`block ${lineClassName}`}
            // Same unit on both ends ("110%" -> "0%"): mixing % and px makes
            // the interpolation unreliable and the line can stay hidden.
            initial={reduced ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: EASE.outExpo, delay: delay + i * 0.09 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
