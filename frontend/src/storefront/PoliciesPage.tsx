import { useState } from "react";
import StorefrontLayout from "./StorefrontLayout";
import { usePageMeta } from "../usePageMeta";
import { useJsonLd } from "../useJsonLd";
import Reveal from "../Reveal";

const FAQS = [
  {
    q: "Do I need to create an account to order?",
    a: "No. There's no account, cart, or checkout — browse the catalog, message us on WhatsApp for the piece you want, and we take it from there.",
  },
  {
    q: "How do I pay?",
    a: "Payment details are shared and confirmed over WhatsApp once your order is finalized, including which methods we can accept for your order.",
  },
  {
    q: "Do you deliver everywhere?",
    a: "Delivery timelines and charges depend on your location and are confirmed with you directly over WhatsApp before the order is placed.",
  },
  {
    q: "What happens when a sale ends?",
    a: "Once a sale's end date passes, the item automatically goes back to its regular price — you'll always see the current, correct price on the product page before you order.",
  },
  {
    q: "What if something I want is out of stock?",
    a: "It'll be clearly marked out of stock on its product page and can't be ordered until we bring it back — message us on WhatsApp if you'd like to know when that happens.",
  },
  {
    q: "Can I exchange or return unstitched fabric?",
    a: "Because unstitched fabric can't be resold once cut, we're generally unable to accept returns once an order has shipped. If a piece arrives visibly damaged or doesn't match what was confirmed, message us within 48 hours of delivery and we'll sort it out.",
  },
];

export default function PoliciesPage() {
  usePageMeta({
    title: "Policies",
    description:
      "How ordering, payment, delivery, exchanges and returns work at Baig Cloth — the basics before you order over WhatsApp.",
  });

  useJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Reveal>
          <h1 className="font-serif text-3xl mb-1">Policies</h1>
          <p className="text-[#6b7280] text-sm mb-8">
            Payment, delivery, and returns — the basics before you order.
          </p>
        </Reveal>

        <div className="space-y-8 text-sm text-[#1f2937] leading-relaxed">
          <Reveal delayMs={60}>
            <Section title="Ordering">
              <p>
                Browse the catalog and message us on WhatsApp for any piece you're interested in.
                We'll confirm availability, walk you through sizing if needed, and take your order
                directly in the chat — no separate account or checkout required.
              </p>
            </Section>
          </Reveal>

          <Reveal delayMs={120}>
            <Section title="Payment">
              <p>
                Payment details are shared and confirmed over WhatsApp once your order is finalized.
                We'll let you know the accepted methods (e.g. bank transfer, cash on delivery in
                select areas) at that point.
              </p>
            </Section>
          </Reveal>

          <Reveal delayMs={180}>
            <Section title="Delivery">
              <p>
                Delivery timelines and charges depend on your location and are confirmed with you
                directly over WhatsApp before the order is placed. We'll keep you updated once your
                order is on its way.
              </p>
            </Section>
          </Reveal>

          <Reveal delayMs={240}>
            <Section title="Exchanges & Returns">
              <p>
                Because unstitched fabric can't be resold once cut, we're generally unable to accept
                returns once an order has shipped. If a piece arrives visibly damaged or doesn't
                match what was confirmed, message us on WhatsApp within 48 hours of delivery and
                we'll sort it out.
              </p>
            </Section>
          </Reveal>
        </div>

        <Reveal delayMs={280}>
          <div className="mt-12 pt-8 border-t border-dashed border-[#dde1e8]">
            <h2 className="font-serif text-lg mb-4">Frequently Asked Questions</h2>
            <div>
              {FAQS.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </Reveal>

        <p className="text-[#6b7280] text-xs mt-8">
          Questions about any of this? Message us on WhatsApp and we're happy to clarify.
        </p>
      </div>
    </StorefrontLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-lg mb-2">{title}</h2>
      {children}
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " is-open" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left text-sm text-[#101014]"
      >
        <span>{q}</span>
        <svg
          className="faq-chevron shrink-0"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="faq-answer">
        <div>
          <p className="text-[#1f2937] text-sm leading-relaxed pb-4">{a}</p>
        </div>
      </div>
    </div>
  );
}
