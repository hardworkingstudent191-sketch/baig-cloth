import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, MessageCircle, Instagram, Facebook } from "lucide-react";
import { useShop } from "../../lib/store";
import { useSite } from "../../lib/site";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { slugify } from "../../lib/format";
import { whatsappUrl, generalEnquiryMessage } from "../../lib/whatsapp";
import { EASE } from "../../lib/motion";
import Logo from "../ui/Logo";

const PRIMARY = [
  { to: "/women", label: "Women", gender: "women" as const },
  { to: "/men", label: "Men", gender: "men" as const },
  { to: "/collections", label: "Collections" },
  { to: "/new", label: "New In" },
  { to: "/sale", label: "Sale" },
  { to: "/lookbook", label: "Lookbook" },
];
const SECONDARY = [
  { to: "/about", label: "Our story" },
  { to: "/store", label: "Visit the shop" },
  { to: "/size-guide", label: "Size & measurement guide" },
  { to: "/fabric-care", label: "Fabric care" },
  { to: "/policies", label: "Delivery & returns" },
];

/**
 * Full-screen menu for phones (also usable on desktop). Large serif links
 * with a staggered rise; categories appear under Women/Men so a shopper can
 * jump straight to "Lawn" or "Wash & Wear" in one tap.
 */
export default function MenuDrawer() {
  const open = useShop((s) => s.menuOpen);
  const setOpen = useShop((s) => s.setMenuOpen);
  const site = useSite();
  const { data: categories } = useFetch((signal) => api.categories(undefined, signal), "menu-categories", open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          className="fixed inset-0 z-50 bg-ivory text-charcoal flex flex-col"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: EASE.inOutQuart }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="gutter flex items-center justify-between" style={{ height: "var(--header-h)" }}>
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
              <Logo className="h-7 w-auto" />
              <span className="font-display text-[1.35rem] leading-none">Baig Cloth</span>
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="-mr-2 p-2 rounded-full" aria-label="Close menu">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto gutter pt-4 pb-10" aria-label="Menu">
            <ul className="space-y-1">
              {PRIMARY.map((item, i) => {
                const cats = item.gender && categories ? categories.filter((c) => c.gender === item.gender) : [];
                return (
                  <motion.li
                    key={item.to}
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE.outExpo, delay: 0.15 + i * 0.05 }}
                  >
                    <Link to={item.to} className="font-display text-[2.4rem] leading-[1.05] block py-1.5 active:opacity-60" onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                    {cats.length > 0 && (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-3 pl-0.5">
                        {cats.map((c) => (
                          <li key={c.id}>
                            <Link to={`${item.to}/${slugify(c.name)}`} className="text-sm text-muted hover:text-charcoal" onClick={() => setOpen(false)}>
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.li>
                );
              })}
            </ul>

            <motion.ul
              className="mt-8 pt-6 border-t border-line space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {SECONDARY.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-[15px] hover:opacity-70" onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          </nav>

          <motion.div
            className="gutter py-5 border-t border-line flex items-center justify-between gap-4"
            style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <a
              href={whatsappUrl(site.whatsapp, generalEnquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-charcoal text-ivory rounded-pill px-5 py-3 text-sm font-medium"
            >
              <MessageCircle size={18} /> WhatsApp us
            </a>
            <div className="flex items-center gap-3 text-muted">
              {site.social.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={20} strokeWidth={1.5} /></a>
              )}
              {site.social.facebook && (
                <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={20} strokeWidth={1.5} /></a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
