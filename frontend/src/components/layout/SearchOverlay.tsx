import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { useShop } from "../../lib/store";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { imageSource } from "../../lib/images";
import { EASE } from "../../lib/motion";
import Price from "../ui/Price";

const SUGGESTIONS = ["Lawn", "Wash & Wear", "Embroidered", "Karandi", "Cotton"];

/** Drops from the header: live results as you type (debounced), Enter for the full results page. */
export default function SearchOverlay() {
  const open = useShop((s) => s.searchOpen);
  const setOpen = useShop((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data, loading } = useFetch((signal) => api.products({ search: debounced, limit: 6 }, signal), debounced, open && debounced.length >= 2);
  const results = debounced.length >= 2 ? data?.items ?? [] : [];

  function submit() {
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-50 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="fixed inset-x-0 top-0 z-50 bg-ivory text-charcoal shadow-lift"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: EASE.outExpo }}
          >
            <form
              className="gutter flex items-center gap-3 border-b border-line"
              style={{ height: "var(--header-h)" }}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <Search size={20} strokeWidth={1.6} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                enterKeyHint="search"
                placeholder="Search lawn, wash & wear, colours…"
                className="flex-1 bg-transparent outline-none text-[17px] md:text-lg placeholder:text-muted/70"
                aria-label="Search products"
              />
              <button type="button" onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Close search">
                <X size={22} strokeWidth={1.5} />
              </button>
            </form>

            <div className="gutter py-5 max-h-[70dvh] overflow-y-auto">
              {debounced.length < 2 ? (
                <div>
                  <p className="eyebrow text-muted mb-3">Popular</p>
                  <ul className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <li key={s}>
                        <button type="button" onClick={() => setQ(s)} className="rounded-pill border border-line px-4 py-2 text-sm hover:bg-bone">{s}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : loading && !data ? (
                <p className="text-sm text-muted">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted">Nothing matches “{debounced}”. Try a fabric name or a colour.</p>
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {results.map((p) => {
                      const img = p.images[0] ?? (p.image_urls[0] ? { url: p.image_urls[0] } : null);
                      const src = img ? imageSource(img, 400, p.name) : null;
                      return (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 hover:opacity-80">
                            <span className="w-12 aspect-[4/5] overflow-hidden rounded-card bg-bone shrink-0">
                              {src && <img src={src.src} srcSet={src.srcSet} sizes="48px" alt="" className="h-full w-full object-cover" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[15px] truncate">{p.name}</span>
                              <span className="block text-xs text-muted">{[p.fabric, p.color].filter(Boolean).join(" · ")}</span>
                            </span>
                            <Price product={p} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onClick={submit} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium group">
                    See all results for “{debounced}” <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
