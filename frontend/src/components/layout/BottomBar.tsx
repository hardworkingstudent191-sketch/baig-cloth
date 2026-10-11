import { NavLink } from "react-router-dom";
import { Heart, House, ShoppingBag, Sparkles, User } from "lucide-react";
import { useShop, selectBagCount } from "../../lib/store";

/**
 * Phone-only navigation within thumb reach: Home · Women · Men · Saved · Bag.
 * Fixed above the iOS home indicator. Hidden on product pages, which swap in
 * their own "Add to bag / WhatsApp" bar.
 */
export default function BottomBar() {
  const bagCount = useShop(selectBagCount);
  const wishlistCount = useShop((s) => s.wishlist.length);
  const items = [
    { to: "/", label: "Home", icon: House, end: true },
    { to: "/women", label: "Women", icon: Sparkles },
    { to: "/men", label: "Men", icon: User },
    { to: "/saved", label: "Saved", icon: Heart, badge: wishlistCount },
    { to: "/bag", label: "Bag", icon: ShoppingBag, badge: bagCount },
  ];
  return (
    <nav
      aria-label="Quick navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-ivory/95 backdrop-blur-md border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5" style={{ height: "var(--bottom-bar-h)" }}>
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <li key={to} className="contents">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 text-[10px] tracking-wide transition-colors ${isActive ? "text-navy" : "text-muted"}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                    {badge ? (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-navy text-ivory text-[9px] font-medium leading-4 text-center">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={isActive ? "font-medium" : ""}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
