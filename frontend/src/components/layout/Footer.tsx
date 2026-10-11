import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle, MapPin, Clock } from "lucide-react";
import { useSite } from "../../lib/site";
import { whatsappUrl, generalEnquiryMessage } from "../../lib/whatsapp";
import Logo from "../ui/Logo";

const SHOP = [
  { to: "/women", label: "Women" },
  { to: "/men", label: "Men" },
  { to: "/collections", label: "Collections" },
  { to: "/new", label: "New In" },
  { to: "/sale", label: "Sale" },
  { to: "/lookbook", label: "Lookbook" },
];
const HELP = [
  { to: "/policies", label: "Ordering, delivery & returns" },
  { to: "/size-guide", label: "Size & measurement guide" },
  { to: "/fabric-care", label: "Fabric care" },
  { to: "/store", label: "Visit the shop" },
  { to: "/about", label: "Our story" },
];

export default function Footer() {
  const site = useSite();
  return (
    <footer className="bg-charcoal text-ivory mt-24">
      <div className="gutter py-14 md:py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo className="h-9 w-auto" />
            <span className="font-display text-3xl leading-none">Baig Cloth</span>
          </Link>
          <p className="mt-5 max-w-sm text-ivory/70 text-[15px] leading-relaxed text-pretty">{site.tagline}</p>
          <a
            href={whatsappUrl(site.whatsapp, generalEnquiryMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 bg-ivory text-charcoal rounded-pill px-5 py-3 text-sm font-medium hover:bg-bone transition-colors"
          >
            <MessageCircle size={18} /> Message us on WhatsApp
          </a>
          <div className="mt-6 flex items-center gap-4 text-ivory/60">
            {site.social.instagram && <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-ivory"><Instagram size={20} strokeWidth={1.5} /></a>}
            {site.social.facebook && <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-ivory"><Facebook size={20} strokeWidth={1.5} /></a>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-4">
          <div>
            <h2 className="eyebrow text-ivory/50 mb-4">Shop</h2>
            <ul className="space-y-2.5 text-[15px]">
              {SHOP.map((l) => (
                <li key={l.to}><Link to={l.to} className="text-ivory/85 hover:text-ivory">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="eyebrow text-ivory/50 mb-4">Help</h2>
            <ul className="space-y-2.5 text-[15px]">
              {HELP.map((l) => (
                <li key={l.to}><Link to={l.to} className="text-ivory/85 hover:text-ivory">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-3 text-[15px]">
          <h2 className="eyebrow text-ivory/50 mb-4">Find us</h2>
          <p className="flex gap-2.5 text-ivory/85"><MapPin size={18} className="shrink-0 mt-0.5" strokeWidth={1.5} /><span>{site.address.join(", ")}</span></p>
          {site.hours.length > 0 && (
            <div className="mt-3 flex gap-2.5 text-ivory/85">
              <Clock size={18} className="shrink-0 mt-0.5" strokeWidth={1.5} />
              <ul className="space-y-0.5">
                {site.hours.map((h) => (
                  <li key={h.days}><span className="text-ivory/60">{h.days}</span> {h.hours}</li>
                ))}
              </ul>
            </div>
          )}
          {site.phone_display && <p className="mt-3 text-ivory/85">{site.phone_display}</p>}
        </div>
      </div>
      <div className="gutter py-5 border-t border-ivory/10 flex flex-col md:flex-row gap-2 md:items-center justify-between text-xs text-ivory/50">
        <p>© {new Date().getFullYear()} Baig Cloth{site.established ? ` · Est. ${site.established}` : ""} · {site.city}</p>
        <p>Orders are confirmed on WhatsApp. No account, no checkout.</p>
      </div>
    </footer>
  );
}
