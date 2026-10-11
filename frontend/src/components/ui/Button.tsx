import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "whatsapp";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium tracking-wide select-none transition-[transform,background-color,color,opacity] duration-300 [transition-timing-function:var(--ease-out-quart)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  primary: "bg-charcoal text-ivory hover:bg-ink",
  secondary: "bg-transparent text-charcoal border border-charcoal/70 hover:bg-charcoal hover:text-ivory",
  ghost: "bg-transparent text-charcoal hover:bg-bone",
  whatsapp: "bg-navy text-ivory hover:bg-navy-deep",
};
const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = "primary", size = "md", className = "", children }: Common & { to: string }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({ variant = "primary", size = "md", className = "", children, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
