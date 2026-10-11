import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, SlidersHorizontal } from "lucide-react";
import type { Facets, SortOption } from "../../lib/types";
import { EASE } from "../../lib/motion";
import { Button } from "../ui/Button";
import { SORT_LABELS } from "./Listing";

export interface FilterState {
  fabric?: string;
  color?: string;
  min?: number;
  max?: number;
  sort: SortOption;
}

const PRICE_BANDS: { label: string; min?: number; max?: number }[] = [
  { label: "Under Rs 2,500", max: 2500 },
  { label: "Rs 2,500 – 4,000", min: 2500, max: 4000 },
  { label: "Rs 4,000 +", min: 4000 },
];

export function activeFilterCount(f: FilterState): number {
  return [f.fabric, f.color, f.min !== undefined || f.max !== undefined ? 1 : undefined].filter((v) => v !== undefined).length;
}

/** The "Filter" button + the bottom sheet (side panel on desktop) it opens. */
export default function FilterSheet({ facets, value, onChange }: { facets: Facets | null; value: FilterState; onChange: (v: FilterState) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(value);
  useEffect(() => setDraft(value), [value, open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  const count = activeFilterCount(value);

  function apply() {
    onChange(draft);
    setOpen(false);
  }
  function clear() {
    const cleared: FilterState = { sort: draft.sort };
    setDraft(cleared);
    onChange(cleared);
    setOpen(false);
  }

  const chip = (active: boolean) =>
    `rounded-pill border px-3.5 h-9 text-sm transition-colors ${active ? "bg-charcoal text-ivory border-charcoal" : "border-line hover:border-charcoal/50"}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 h-10 rounded-pill border border-line px-4 text-sm hover:border-charcoal/50">
        <SlidersHorizontal size={16} strokeWidth={1.6} />
        Filter{count > 0 && <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-charcoal text-ivory text-[11px] px-1">{count}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="scrim"
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-50 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed z-50 bg-ivory inset-x-0 bottom-0 max-h-[86dvh] rounded-t-2xl md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:max-h-none md:rounded-none flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: EASE.outExpo }}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
                <h2 className="font-display text-xl">Filter & sort</h2>
                <button type="button" onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Close"><X size={22} strokeWidth={1.5} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
                <section>
                  <h3 className="eyebrow text-muted mb-3">Sort</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                      <button key={k} type="button" className={chip(draft.sort === k)} onClick={() => setDraft({ ...draft, sort: k })}>{SORT_LABELS[k]}</button>
                    ))}
                  </div>
                </section>

                {facets && facets.fabrics.length > 1 && (
                  <section>
                    <h3 className="eyebrow text-muted mb-3">Fabric</h3>
                    <div className="flex flex-wrap gap-2">
                      {facets.fabrics.map((f) => (
                        <button key={f.value} type="button" className={chip(draft.fabric === f.value)} onClick={() => setDraft({ ...draft, fabric: draft.fabric === f.value ? undefined : f.value })}>
                          {f.value} <span className="text-muted/80 ml-1">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {facets && facets.colors.length > 1 && (
                  <section>
                    <h3 className="eyebrow text-muted mb-3">Colour</h3>
                    <div className="flex flex-wrap gap-2">
                      {facets.colors.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          aria-label={c.name}
                          aria-pressed={draft.color === c.name}
                          onClick={() => setDraft({ ...draft, color: draft.color === c.name ? undefined : c.name })}
                          className={`grid h-9 w-9 place-items-center rounded-full border-2 transition-transform active:scale-90 ${draft.color === c.name ? "border-charcoal" : "border-transparent"}`}
                        >
                          <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: c.hex || "#ccc" }} />
                        </button>
                      ))}
                    </div>
                    {draft.color && <p className="mt-2 text-sm">{draft.color}</p>}
                  </section>
                )}

                <section>
                  <h3 className="eyebrow text-muted mb-3">Price</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_BANDS.map((b) => {
                      const active = draft.min === b.min && draft.max === b.max;
                      return (
                        <button key={b.label} type="button" className={chip(active)} onClick={() => setDraft({ ...draft, min: active ? undefined : b.min, max: active ? undefined : b.max })}>{b.label}</button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="shrink-0 border-t border-line px-5 py-4 flex gap-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                <Button variant="secondary" className="flex-1" onClick={clear}>Clear</Button>
                <Button className="flex-[2]" onClick={apply}>Show results</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
