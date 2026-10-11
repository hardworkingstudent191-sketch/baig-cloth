import { useState } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import PageHeader from "../components/ui/PageHeader";
import Listing from "../components/product/Listing";

/** New arrivals (is_new = added in the last 30 days or flagged); falls back to the latest pieces when the month has been quiet. */
export default function NewPage() {
  const [fallback, setFallback] = useState(false);
  usePageMeta({ title: "New In", description: "The latest unstitched fabric at Baig Cloth — new lawn, wash & wear and embroidered pieces, ordered over WhatsApp." });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "New In" }]} eyebrow="Just arrived" title="New In" intro={fallback ? "Our most recent pieces." : "Added in the last few weeks."} />
      <div className="gutter">
        <Listing
          key={fallback ? "latest" : "new"}
          filters={fallback ? { sort: "newest" } : { is_new: true, sort: "newest" }}
          onTotal={(total) => {
            if (!fallback && total === 0) setFallback(true);
          }}
          emptyTitle="Nothing new this week"
          emptyBody="New fabric lands every few weeks — check back soon."
        />
      </div>
    </div>
  );
}
