import { usePageMeta } from "../lib/usePageMeta";
import PageHeader from "../components/ui/PageHeader";
import { BagContents } from "../components/layout/BagDrawer";

export default function BagPage() {
  usePageMeta({ title: "Your bag", description: "Pieces you're about to order from Baig Cloth over WhatsApp.", noindex: true });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Bag" }]} eyebrow="WhatsApp order" title="Your bag" intro="Everything here goes into one WhatsApp message. We confirm stock, delivery and payment in the chat." />
      <div className="gutter max-w-2xl">
        <div className="flex flex-col">
          <BagContents page />
        </div>
      </div>
    </div>
  );
}
