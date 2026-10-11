import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { useShop, selectBagCount } from "../../lib/store";
import Logo from "../ui/Logo";

const NAV = [
  { to: "/women", label: "Women" },
  { to: "/men", label: "Men" },
  { to: "/collections", label: "Collections" },
  { to: "/new", label: "New In" },
  { to: "/sale", label: "Sale" },
  { to: "/lookbook", label: "Lookbook" },
];

/**
 * Over a hero the header starts transparent with light text and turns solid
 * ivory (with a hairline) once the page scrolls; everywhere else it's solid
 * from the start. Sticky, 64 px on phones, 76 px from md.
 */
export default function Header({ transparent }: { transparent: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const setMenuOpen = useShop((s) => s.setMenuOpen);
  const setBagOpen = useShop((s) => s.setBagOpen);
  const bagCount = useShop(selectBagCount);
  const wishlistCount = useShop((s) => s.wishlist.length);
  const [searchOpen, setSearchOpen] = useSearchOpen();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !transparent || scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,color,box-shadow] duration-500 ${
        solid ? "bg-ivory/90 backdrop-blur-md text-charcoal shadow-[0_1px_0_0_var(--color-line)]" : "bg-transparent text-ivory"
      }`}
      style={{ height: "var(--header-h)" }}
    >
      <div className="gutter h-full flex items-center justify-between gap-4">
        {/* Left: menu (mobile) / nav (desktop) */}
        <div className="flex items-center gap-2 md:gap-8 flex-1">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden -ml-2 p-2 rounded-full active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.6} />
          </button>
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `eyebrow whitespace-nowrap relative py-2 transition-opacity hover:opacity-70 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-current after:transition-[width] after:duration-500 after:[transition-timing-function:var(--ease-out-expo)] ${
                    isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Centre: wordmark */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Baig Cloth — home">
          <Logo className="h-7 w-auto md:h-8" />
          <span className="font-display text-[1.35rem] md:text-2xl leading-none tracking-tight">Baig Cloth</span>
        </Link>

        {/* Right: actions */}
        <div className="flex items-center justify-end gap-1 md:gap-2 flex-1">
          <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-full hover:opacity-70 transition-opacity" aria-label="Search">
            <Search size={21} strokeWidth={1.6} />
          </button>
          <Link to="/saved" className="hidden md:inline-flex relative p-2 rounded-full hover:opacity-70 transition-opacity" aria-label={`Saved pieces (${wishlistCount})`}>
            <Heart size={21} strokeWidth={1.6} />
            {wishlistCount > 0 && <Count n={wishlistCount} />}
          </Link>
          <button type="button" onClick={() => setBagOpen(true)} className="relative p-2 -mr-2 rounded-full hover:opacity-70 transition-opacity" aria-label={`Bag (${bagCount})`}>
            <ShoppingBag size={21} strokeWidth={1.6} />
            {bagCount > 0 && <Count n={bagCount} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-navy text-ivory text-[10px] font-medium leading-[18px] text-center">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Search overlay open state lives on the store so the overlay and the header agree. */
export function useSearchOpen(): [boolean, (open: boolean) => void] {
  const open = useShop((s) => s.searchOpen);
  const set = useShop((s) => s.setSearchOpen);
  return [open, set];
}
