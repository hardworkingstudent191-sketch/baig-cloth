import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "./api";
import logoLight from "../assets/logo-light.png";

const navItems = [
  { to: "/admin", label: "Products", end: true },
  { to: "/admin/categories", label: "Categories" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#f2f3f5] flex">
      <aside className="w-56 shrink-0 border-r border-[#24304d] flex flex-col">
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

      <main className="flex-1 px-8 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
