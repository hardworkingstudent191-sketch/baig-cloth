import { MapPin, Clock, Phone, MessageCircle, Navigation } from "lucide-react";
import { usePageMeta } from "../lib/usePageMeta";
import { useJsonLd } from "../lib/useJsonLd";
import { useSite } from "../lib/site";
import { whatsappUrl, generalEnquiryMessage } from "../lib/whatsapp";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { ButtonAnchor } from "../components/ui/Button";

export default function StorePage() {
  const site = useSite();
  usePageMeta({ title: "Visit the shop", description: `Baig Cloth in ${site.city} — address, opening hours and directions. Or order from anywhere over WhatsApp.` });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "Baig Cloth",
    telephone: site.phone_display || undefined,
    address: { "@type": "PostalAddress", streetAddress: site.address.slice(0, -1).join(", "), addressLocality: site.city, addressCountry: "PK" },
    ...(site.map.lat && site.map.lng ? { geo: { "@type": "GeoCoordinates", latitude: site.map.lat, longitude: site.map.lng } } : {}),
    openingHours: site.hours.map((h) => `${h.days} ${h.hours}`),
    url: window.location.origin,
  });
  const embed = site.map.lat && site.map.lng ? `https://www.google.com/maps?q=${site.map.lat},${site.map.lng}&z=15&output=embed` : null;

  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Store" }]} eyebrow={site.city} title="Visit the shop" intro="Come and feel the fabric, or order from anywhere in Pakistan over WhatsApp." />
      <div className="gutter grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-7 aspect-[4/3] lg:aspect-auto lg:min-h-[520px] overflow-hidden rounded-card bg-bone">
          {embed ? (
            <iframe title="Map" src={embed} className="h-full w-full border-0 grayscale-[0.3] contrast-[1.05]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted text-sm">Map coming soon</div>
          )}
        </Reveal>
        <div className="lg:col-span-5 space-y-8">
          <Reveal delay={0.05}>
            <h2 className="eyebrow text-muted mb-3">Address</h2>
            <p className="flex gap-3 text-[17px] leading-relaxed"><MapPin size={20} className="shrink-0 mt-1" strokeWidth={1.5} /><span>{site.address.map((l, i) => <span key={i} className="block">{l}</span>)}</span></p>
            {site.map.url && (
              <ButtonAnchor href={site.map.url} target="_blank" rel="noopener noreferrer" variant="secondary" className="mt-4"><Navigation size={16} /> Get directions</ButtonAnchor>
            )}
          </Reveal>
          {site.hours.length > 0 && (
            <Reveal delay={0.1}>
              <h2 className="eyebrow text-muted mb-3">Opening hours</h2>
              <ul className="space-y-1.5">
                {site.hours.map((h) => (
                  <li key={h.days} className="flex gap-3 text-[16px]"><Clock size={20} className="shrink-0 mt-0.5" strokeWidth={1.5} /><span><span className="text-muted">{h.days}</span> · {h.hours}</span></li>
                ))}
              </ul>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <h2 className="eyebrow text-muted mb-3">Talk to us</h2>
            <div className="flex flex-wrap gap-3">
              <ButtonAnchor href={whatsappUrl(site.whatsapp, generalEnquiryMessage())} target="_blank" rel="noopener noreferrer" variant="whatsapp"><MessageCircle size={18} /> WhatsApp</ButtonAnchor>
              {site.phone_display && <ButtonAnchor href={`tel:+${site.whatsapp}`} variant="secondary"><Phone size={18} /> {site.phone_display}</ButtonAnchor>}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
