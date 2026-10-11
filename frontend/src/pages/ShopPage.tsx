import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import { useJsonLd } from "../lib/useJsonLd";
import { slugify } from "../lib/format";
import type { Gender, SortOption } from "../lib/types";
import PageHeader from "../components/ui/PageHeader";
import Listing, { SortSelect } from "../components/product/Listing";
import FilterSheet, { type FilterState } from "../components/product/FilterSheet";

const INTRO: Record<Gender, string> = {
  women: "Lawn, cotton and embroidered unstitched suits — chosen by hand, ordered over WhatsApp.",
  men: "Wash & wear, cotton and karandi shalwar-kameez fabric for every season.",
};

/**
 * /women, /men and /women/:category. Category chips drive the URL so a
 * filtered view is shareable; fabric/colour/price/sort live in the query
 * string for the same reason. Filters open in a bottom sheet on phones.
 */
export default function ShopPage({ gender }: { gender: Gender }) {
  const { category: slug } = useParams();
  const [params, setParams] = useSearchParams();

  const { data: categories, loading: catsLoading } = useFetch((signal) => api.categories(gender, signal), `cats-${gender}`);
  const category = useMemo(() => (slug && categories ? categories.find((c) => slugify(c.name) === slug) : undefined), [slug, categories]);
  const categoryMissing = !!slug && !catsLoading && categories !== null && !category;

  const filters: FilterState = {
    fabric: params.get("fabric") ?? undefined,
    color: params.get("color") ?? undefined,
    min: params.get("min") ? Number(params.get("min")) : undefined,
    max: params.get("max") ? Number(params.get("max")) : undefined,
    sort: (params.get("sort") as SortOption) || "newest",
  };
  function setFilters(f: FilterState) {
    const next = new URLSearchParams();
    if (f.fabric) next.set("fabric", f.fabric);
    if (f.color) next.set("color", f.color);
    if (f.min !== undefined) next.set("min", String(f.min));
    if (f.max !== undefined) next.set("max", String(f.max));
    if (f.sort !== "newest") next.set("sort", f.sort);
    setParams(next, { replace: true });
  }

  const { data: facets } = useFetch((signal) => api.facets({ gender, category_id: category?.id }, signal), `facets-${gender}-${category?.id ?? "all"}`, !slug || !!category);

  const genderLabel = gender === "women" ? "Women" : "Men";
  const title = category ? category.name : genderLabel;
  usePageMeta({
    title: catsLoading && slug ? null : category ? `${genderLabel}'s ${category.name}` : `${genderLabel}'s Unstitched Fabric`,
    description: category ? `${genderLabel}'s ${category.name} unstitched fabric at Baig Cloth. Browse the range and order over WhatsApp.` : INTRO[gender],
  });
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
      { "@type": "ListItem", position: 2, name: genderLabel, item: `${window.location.origin}/${gender}` },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${window.location.origin}/${gender}/${slugify(category.name)}` }] : []),
    ],
  });

  const ready = !slug || !!category;

  return (
    <div className="pb-8">
      <PageHeader
        crumbs={category ? [{ to: `/${gender}`, label: genderLabel }, { label: category.name }] : [{ label: genderLabel }]}
        eyebrow={category ? `${genderLabel} · Unstitched` : "Unstitched fabric"}
        title={categoryMissing ? "Category not found" : title}
        intro={category ? undefined : INTRO[gender]}
      />

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <div className="gutter mb-5 md:mb-8">
          <ul className="flex gap-2 overflow-x-auto no-scrollbar -mx-[var(--page-gutter)] px-[var(--page-gutter)] pb-1" aria-label="Categories">
            <li className="shrink-0">
              <Link to={`/${gender}`} className={`inline-flex h-9 items-center rounded-pill border px-4 text-sm transition-colors ${!slug ? "bg-charcoal text-ivory border-charcoal" : "border-line hover:border-charcoal/50"}`}>All</Link>
            </li>
            {categories.map((c) => {
              const active = category?.id === c.id;
              return (
                <li key={c.id} className="shrink-0">
                  <Link to={`/${gender}/${slugify(c.name)}`} className={`inline-flex h-9 items-center rounded-pill border px-4 text-sm transition-colors ${active ? "bg-charcoal text-ivory border-charcoal" : "border-line hover:border-charcoal/50"}`}>{c.name}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="gutter">
        {categoryMissing ? (
          <p className="text-muted">That category doesn't exist. <Link to={`/${gender}`} className="underline">See all {genderLabel.toLowerCase()}'s fabric</Link>.</p>
        ) : (
          <Listing
            enabled={ready}
            filters={{
              gender,
              category_id: category?.id,
              fabric: filters.fabric,
              color: filters.color,
              min_price: filters.min,
              max_price: filters.max,
              sort: filters.sort,
            }}
            emptyTitle="No pieces match"
            emptyBody="Try clearing a filter — or message us on WhatsApp and we'll find it for you."
            toolbar={(total) => (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{total === null ? "" : `${total} ${total === 1 ? "piece" : "pieces"}`}</p>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block"><SortSelect value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} /></div>
                  <FilterSheet facets={facets} value={filters} onChange={setFilters} />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
