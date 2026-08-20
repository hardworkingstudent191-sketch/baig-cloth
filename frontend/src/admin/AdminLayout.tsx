import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "./api";

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
    <div className="min-h-screen bg-[#16140f] text-[#ede7db] flex">
      <aside className="w-56 shrink-0 border-r border-[#322d24] flex flex-col">
        <div className="px-5 py-6 border-b border-dashed border-[#322d24]">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#948b7a] uppercase">
            Baig Cloth
          </p>
          <h1 className="font-serif text-xl mt-0.5">Admin</h1>
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
                    ? "bg-[#1f1c16] text-[#c1652f] font-medium"
                    : "text-[#948b7a] hover:text-[#ede7db] hover:bg-[#1f1c16]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-dashed border-[#322d24]">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-sm text-[#948b7a] hover:text-[#b3543f] hover:bg-[#1f1c16] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
