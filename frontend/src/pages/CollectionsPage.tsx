import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import type { Collection } from "../lib/types";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { Skeleton } from "../components/ui/Skeleton";
import ErrorState, { EmptyState } from "../components/ui/ErrorState";
import Img from "../components/ui/Img";

export function CollectionCard({ c, index = 0, priority = false }: { c: Collection; index?: number; priority?: boolean }) {
  return (
    <Reveal as="li" delay={(index % 3) * 0.08}>
      <Link to={`/collections/${c.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-gradient-to-br from-bone to-sand">
          {c.cover && (
            <Img src={c.cover} alt="" loading={priority ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover transition-transform duration-[1400ms] [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.05]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-ivory">
            <p className="eyebrow text-ivory/70 mb-1.5">{c.count} {c.count === 1 ? "piece" : "pieces"}{c.gender !== "all" ? ` · ${c.gender}` : ""}</p>
            <h3 className="font-display text-2xl md:text-3xl leading-tight flex items-end gap-2">
              {c.name}
              <ArrowUpRight size={22} className="mb-1 opacity-0 -translate-x-1 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
            </h3>
            {c.tagline && <p className="mt-1 text-sm text-ivory/80 text-pretty">{c.tagline}</p>}
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export default function CollectionsPage() {
  const { data, loading, error, reload } = useFetch((signal) => api.collections(signal), "collections");
  usePageMeta({ title: "Collections", description: "Baig Cloth's curated collections — lawn for summer, festive embroidery, wash & wear essentials." });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Collections" }]} eyebrow="Curated" title="Collections" intro="Edits we've put together by season, occasion and fabric." />
      <div className="gutter">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No collections yet" body="They're being put together — browse by category in the meantime." />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {data.map((c, i) => <CollectionCard key={c.id} c={c} index={i} priority={i < 2} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
