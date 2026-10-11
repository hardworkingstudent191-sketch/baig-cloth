import { MessageCircle } from "lucide-react";
import { useSite } from "../../lib/site";
import { whatsappUrl, generalEnquiryMessage } from "../../lib/whatsapp";

/** Always-there WhatsApp button: above the bottom bar on phones, bottom-right on desktop. */
export default function WhatsAppFab({ hidden }: { hidden?: boolean }) {
  const site = useSite();
  if (hidden) return null;
  return (
    <a
      href={whatsappUrl(site.whatsapp, generalEnquiryMessage())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 md:right-8 z-30 flex items-center gap-2 bg-charcoal text-ivory rounded-pill pl-3.5 pr-4 py-3 shadow-lift hover:-translate-y-0.5 transition-transform duration-300"
      style={{ bottom: "calc(var(--bottom-bar-h) + env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-whatsapp opacity-70 animate-ping" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-whatsapp" />
      </span>
      <MessageCircle size={18} strokeWidth={1.8} />
      <span className="text-sm font-medium hidden sm:inline">WhatsApp</span>
    </a>
  );
}
