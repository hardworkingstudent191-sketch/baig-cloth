import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { RevealLines } from "./Reveal";
import { motion } from "motion/react";
import { EASE } from "../../lib/motion";

export interface Crumb {
  to?: string;
  label: string;
}

/** Title block for inner pages: breadcrumbs, eyebrow, serif H1 with a line reveal, optional intro. */
export default function PageHeader({ crumbs, eyebrow, title, intro, meta, className = "" }: { crumbs?: Crumb[]; eyebrow?: string; title: string; intro?: string; meta?: string; className?: string }) {
  return (
    <header className={`gutter pt-6 md:pt-10 pb-6 md:pb-8 ${className}`}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
            <li><Link to="/" className="hover:text-charcoal">Home</Link></li>
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                <ChevronRight size={12} />
                {c.to ? <Link to={c.to} className="hover:text-charcoal">{c.label}</Link> : <span className="text-charcoal">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && <p className="eyebrow text-muted mb-2">{eyebrow}</p>}
      <h1 className="font-display text-[2.4rem] md:text-[3.6rem] leading-[1.02] text-balance">
        <RevealLines lines={[title]} />
      </h1>
      {(intro || meta) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE.outExpo, delay: 0.25 }} className="mt-3 md:mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {intro && <p className="text-[15px] md:text-base text-muted max-w-xl text-pretty">{intro}</p>}
          {meta && <p className="text-sm text-muted">{meta}</p>}
        </motion.div>
      )}
    </header>
  );
}
