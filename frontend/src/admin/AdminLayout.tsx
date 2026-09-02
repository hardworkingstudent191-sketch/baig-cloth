import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "./api";
import logoLight from "../assets/logo-light.png";

const navItems = [
  { to: "/admin", label: "Products", end: true },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/account", label: "Account" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearToken();
    navigate("/admin/login");
  }

  return (
    <div id="admin-root" className="min-h-screen bg-[#0b0f1a] text-[#f2f3f5] flex flex-col md:flex-row">
      {/* Mobile top bar — the old layout had a fixed 224px sidebar with no
          collapse mechanism, which left almost no room for content on a
          phone-width screen. This mirrors the storefront's hamburger pattern. */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#24304d]">
        <div className="flex items-center gap-2">
          <img src={logoLight} alt="" className="h-7 w-auto" />
          <h1 className="font-serif text-lg">Admin</h1>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="w-8 h-8 flex flex-col justify-center gap-1.5"
        >
          <span className="block h-0.5 bg-[#f2f3f5] transition-transform" style={menuOpen ? { transform: "translateY(6px) rotate(45deg)" } : {}} />
          <span className="block h-0.5 bg-[#f2f3f5] transition-opacity" style={menuOpen ? { opacity: 0 } : {}} />
          <span className="block h-0.5 bg-[#f2f3f5] transition-transform" style={menuOpen ? { transform: "translateY(-6px) rotate(-45deg)" } : {}} />
        </button>
      </div>
      {menuOpen && (
        <nav className="md:hidden flex flex-col px-4 py-2 border-b border-[#24304d]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `py-2.5 border-b border-[#24304d] last:border-0 text-sm ${
                  isActive ? "text-[#3f5fc4] font-medium" : "text-[#7b879e]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="text-left py-2.5 text-sm text-[#7b879e]"
          >
            Sign out
          </button>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-[#24304d] flex-col">
        <div className="px-5 py-6 border-b border-dashed border-[#24304d] flex items-center gap-2.5">
          <img src={logoLight} alt="" className="h-8 w-auto shrink-0" />
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7b879e] uppercase">
              Baig Cloth
            </p>
            <h1 className="font-serif text-xl mt-0.5">Admin</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-[#12182a] text-[#3f5fc4] font-medium"
                    : "text-[#7b879e] hover:text-[#f2f3f5] hover:bg-[#12182a]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-dashed border-[#24304d]">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-sm text-[#7b879e] hover:text-[#c0392b] hover:bg-[#12182a] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl min-w-0">{children}</main>
    </div>
  );
}
