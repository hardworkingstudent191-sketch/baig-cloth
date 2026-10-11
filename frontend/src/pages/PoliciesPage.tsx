import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { usePageMeta } from "../lib/usePageMeta";
import { useJsonLd } from "../lib/useJsonLd";
import { useSite } from "../lib/site";
import { EASE } from "../lib/motion";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";

export const FAQS = [
  { q: "Do I need to create an account to order?", a: "No. There's no account, cart or checkout — browse the collection, add pieces to your bag if you like, and send them to us on WhatsApp. We take it from there in the chat." },
  { q: "How do I pay?", a: "Payment details are shared and confirmed over WhatsApp once your order is finalised — bank transfer, Easypaisa/JazzCash, or cash on delivery where available." },
  { q: "Do you deliver everywhere in Pakistan?", a: "Yes. Delivery timelines and charges depend on your city and are confirmed with you on WhatsApp before the order is placed." },
  { q: "How much fabric do I need?", a: "Every piece lists what's included — for example Shirt 3 m, Trouser 2.5 m, Dupatta 2.5 m. If you're unsure, our size & measurement guide explains it, or ask us on WhatsApp with your measurements." },
  { q: "What happens when a sale ends?", a: "Once a sale's end date passes, the piece goes back to its regular price automatically. The price on the product page is always the current one." },
  { q: "What if something I want is out of stock?", a: "It's marked sold out on its page and can't be ordered until it's back. Message us on WhatsApp and we'll tell you when it returns." },
  { q: "Can I exchange or return unstitched fabric?", a: "Because unstitched fabric can't be resold once cut, we generally can't accept returns once an order has shipped. If a piece arrives damaged or isn't what was confirmed, message us within 48 hours of delivery and we'll make it right." },
];

export function Faq({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={f.q}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 py-4 md:py-5 text-left">
              <span className="text-[15px] md:text-base">{f.q}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 text-muted"><Plus size={18} /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE.outQuart }} className="overflow-hidden">
                  <p className="pb-5 text-[15px] text-muted leading-relaxed max-w-2xl text-pretty">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

export default function PoliciesPage() {
  const site = useSite();
  usePageMeta({ title: "Ordering, delivery & returns", description: "How ordering, payment, delivery, exchanges and returns work at Baig Cloth." });
  useJsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

  const sections = [
    { title: "Ordering", body: "Browse, add what you like to your bag, and send it to us on WhatsApp — or just message us about a single piece. We confirm availability, help with sizing if needed, and take the order in the chat. No account, no checkout." },
    { title: "Payment", body: "Payment is confirmed on WhatsApp once your order is finalised. We'll tell you which methods are available for your order — typically bank transfer, Easypaisa/JazzCash, and cash on delivery in select areas." },
    { title: "Delivery", body: site.delivery_note || "Delivery timelines and charges depend on your location and are confirmed with you on WhatsApp before dispatch. We keep you updated once your order is on its way." },
    { title: "Exchanges & returns", body: "Unstitched fabric can't be resold once cut, so we're generally unable to accept returns after an order ships. If a piece arrives visibly damaged or doesn't match what was confirmed, message us within 48 hours of delivery and we'll sort it out." },
  ];

  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Policies" }]} eyebrow="The basics" title="Ordering, delivery & returns" intro="Everything to know before you order — in plain words." />
      <div className="gutter grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-10">
          {sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05} as="section">
              <h2 className="font-display text-2xl mb-2">{s.title}</h2>
              <p className="text-[15px] md:text-base text-muted leading-relaxed text-pretty">{s.body}</p>
            </Reveal>
          ))}
        </div>
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-display text-2xl mb-4">Questions people ask</h2>
            <Faq />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
