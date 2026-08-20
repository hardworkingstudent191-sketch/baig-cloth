import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

const WHATSAPP_NUMBER = "923001234567"; // TODO: replace with your real number

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="storefront-root" className="min-h-screen bg-[#f6f1e6] text-[#241f1a]">
      <header className="sticky top-0 z-30 bg-[#f6f1e6]/95 backdrop-blur border-b border-dashed border-[#d8cdb8]">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <Link to="/" className="font-serif text-xl tracking-tight">
            Baig Cloth
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavItem to="/men">Men</NavItem>
            <NavItem to="/women">Women</NavItem>
            <NavItem to="/sale" accent>
              Sale
            </NavItem>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-8 h-8 flex flex-col justify-center gap-1.5"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="block h-0.5 bg-[#241f1a] transition-transform" style={menuOpen ? { transform: "translateY(6px) rotate(45deg)" } : {}} />
            <span className="block h-0.5 bg-[#241f1a] transition-opacity" style={menuOpen ? { opacity: 0 } : {}} />
            <span className="block h-0.5 bg-[#241f1a] transition-transform" style={menuOpen ? { transform: "translateY(-6px) rotate(-45deg)" } : {}} />
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col border-t border-dashed border-[#d8cdb8] px-4 py-2">
            <NavItem to="/men" onClick={() => setMenuOpen(false)} mobile>
              Men
            </NavItem>
            <NavItem to="/women" onClick={() => setMenuOpen(false)} mobile>
              Women
            </NavItem>
            <NavItem to="/sale" accent onClick={() => setMenuOpen(false)} mobile>
              Sale
            </NavItem>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-dashed border-[#d8cdb8] mt-16 px-4 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <p className="font-serif text-lg mb-2">Baig Cloth</p>
            <p className="text-[#a9987e]">Unstitched fabric, made simple.</p>
          </div>
          <FooterLinks title="Shop" links={[{ to: "/men", label: "Men" }, { to: "/women", label: "Women" }, { to: "/sale", label: "Sale" }]} />
          <FooterLinks title="Info" links={[{ to: "/policies", label: "Policies" }, { to: "/about", label: "About" }]} />
          <div>
            <p className="text-[#a9987e] mb-2">Order via</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              className="text-[#7a1930] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky WhatsApp CTA, always reachable on mobile */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 bg-[#7a1930] text-[#f6f1e6] rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#8f1f39] transition-colors"
        aria-label="Message us on WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}

function NavItem({
  to,
  children,
  accent,
  mobile,
  onClick,
}: {
  to: string;
  children: ReactNode;
  accent?: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${mobile ? "py-2.5 border-b border-[#e5dcc8] last:border-0" : ""} ${
          accent ? "text-[#b5451b] font-medium" : ""
        } ${isActive ? "underline underline-offset-4" : ""} hover:opacity-70 transition-opacity`
      }
    >
      {children}
    </NavLink>
  );
}

function FooterLinks({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[#a9987e] mb-2">{title}</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.26-3.45-.72-2.91-1.17-4.78-4.08-4.93-4.27-.15-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.43.27-.3.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.19-.15.31-.3.48-.15.17-.31.37-.44.5-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.17-.2.73-.85.93-1.14.19-.3.39-.24.65-.15.27.1 1.7.8 1.99.95.3.15.5.22.57.34.07.13.07.75-.17 1.43z" />
    </svg>
  );
}
