import StorefrontLayout from "./StorefrontLayout";
import { usePageMeta } from "../usePageMeta";

export default function PoliciesPage() {
  usePageMeta({
    title: "Policies",
    description:
      "How ordering, payment, delivery, exchanges and returns work at Baig Cloth — the basics before you order over WhatsApp.",
  });

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl mb-1">Policies</h1>
        <p className="text-[#6b7280] text-sm mb-8">
          Payment, delivery, and returns — the basics before you order.
        </p>

        <div className="space-y-8 text-sm text-[#1f2937] leading-relaxed">
          <Section title="Ordering">
            <p>
              Browse the catalog and message us on WhatsApp for any piece you're interested in.
              We'll confirm availability, walk you through sizing if needed, and take your order
              directly in the chat — no separate account or checkout required.
            </p>
          </Section>

          <Section title="Payment">
            <p>
              Payment details are shared and confirmed over WhatsApp once your order is finalized.
              We'll let you know the accepted methods (e.g. bank transfer, cash on delivery in
              select areas) at that point.
            </p>
          </Section>

          <Section title="Delivery">
            <p>
              Delivery timelines and charges depend on your location and are confirmed with you
              directly over WhatsApp before the order is placed. We'll keep you updated once your
              order is on its way.
            </p>
          </Section>

          <Section title="Exchanges & Returns">
            <p>
              Because unstitched fabric can't be resold once cut, we're generally unable to accept
              returns once an order has shipped. If a piece arrives visibly damaged or doesn't
              match what was confirmed, message us on WhatsApp within 48 hours of delivery and
              we'll sort it out.
            </p>
          </Section>
        </div>

        <p className="text-[#6b7280] text-xs mt-10 pt-6 border-t border-dashed border-[#dde1e8]">
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
