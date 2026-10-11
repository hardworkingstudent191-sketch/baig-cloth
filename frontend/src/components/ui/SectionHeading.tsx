import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

/** Eyebrow + serif title (+ optional "See all" link) — the rhythm every section shares. */
export default function SectionHeading({
  eyebrow,
  title,
  link,
  linkLabel = "See all",
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={`flex items-end justify-between gap-6 mb-6 md:mb-10 ${align === "center" ? "text-center flex-col items-center" : ""} ${className}`}>
      <div>
        {eyebrow && <p className="eyebrow text-muted mb-2">{eyebrow}</p>}
        <h2 className="font-display text-[1.9rem] md:text-[2.6rem] leading-[1.05] text-balance">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-medium shrink-0 pb-1">
          {linkLabel}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
