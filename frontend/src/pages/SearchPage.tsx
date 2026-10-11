import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { usePageMeta } from "../lib/usePageMeta";
import type { SortOption } from "../lib/types";
import PageHeader from "../components/ui/PageHeader";
import Listing, { SortSelect } from "../components/product/Listing";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const sort = (params.get("sort") as SortOption) || "newest";
  const [draft, setDraft] = useState(q);
  usePageMeta({ title: q ? `Search: ${q}` : "Search", description: "Search Baig Cloth's unstitched fabric by name, fabric or colour.", noindex: true });

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (draft.trim()) next.set("q", draft.trim());
    if (sort !== "newest") next.set("sort", sort);
    setParams(next);
  }

  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Search" }]} title={q ? `“${q}”` : "Search"} />
      <div className="gutter">
        <form onSubmit={submit} className="mb-8 max-w-xl flex items-center gap-2 border-b border-charcoal/40 focus-within:border-charcoal">
          <Search size={20} strokeWidth={1.6} className="text-muted shrink-0" />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} type="search" enterKeyHint="search" placeholder="Lawn, wash & wear, navy…" className="flex-1 bg-transparent outline-none h-12 text-[17px]" aria-label="Search products" />
          <button type="submit" className="text-sm font-medium px-2 py-2">Search</button>
        </form>
        {q ? (
          <Listing
            filters={{ search: q, sort }}
            emptyTitle={`Nothing matches “${q}”`}
            emptyBody="Try a fabric name (lawn, karandi), a colour, or message us on WhatsApp — we'll find it."
            toolbar={(total) => (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{total === null ? "" : `${total} ${total === 1 ? "result" : "results"}`}</p>
                <SortSelect value={sort} onChange={(s) => setParams(s === "newest" ? { q } : { q, sort: s }, { replace: true })} />
              </div>
            )}
          />
        ) : (
          <p className="text-muted text-[15px]">Type a fabric, colour or name above.</p>
        )}
      </div>
    </div>
  );
}
