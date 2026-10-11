import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import type { SortOption } from "../lib/types";
import PageHeader from "../components/ui/PageHeader";
import Listing, { SortSelect } from "../components/product/Listing";
import { ButtonLink } from "../components/ui/Button";

export default function SalePage() {
  const [params, setParams] = useSearchParams();
  const sort = (params.get("sort") as SortOption) || "newest";
  usePageMeta({ title: "Sale", description: "Unstitched fabric on sale at Baig Cloth — reduced prices while they last, ordered over WhatsApp." });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Sale" }]} eyebrow="Limited time" title="Sale" intro="Prices come down for a while, then go back up — the price you see on a piece is always the current one." />
      <div className="gutter">
        <Listing
          filters={{ on_sale: true, sort }}
          emptyTitle="Nothing on sale right now"
          emptyBody="Follow us on WhatsApp or Instagram — we announce sales there first."
          emptyAction={<ButtonLink to="/new" variant="secondary">See what's new</ButtonLink>}
          toolbar={(total) => (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">{total === null ? "" : `${total} ${total === 1 ? "piece" : "pieces"} on sale`}</p>
              <SortSelect value={sort} onChange={(s) => setParams(s === "newest" ? {} : { sort: s }, { replace: true })} />
            </div>
          )}
        />
      </div>
    </div>
  );
}
