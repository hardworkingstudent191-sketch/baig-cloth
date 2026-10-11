import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { useShop, selectBagCount } from "../../lib/store";
import { useSite } from "../../lib/site";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { imageSource } from "../../lib/images";
import { effectivePrice, formatPrice } from "../../lib/format";
import { bagMessage, whatsappUrl } from "../../lib/whatsapp";
import { EASE } from "../../lib/motion";
import { ButtonAnchor, ButtonLink } from "../ui/Button";
import Price from "../ui/Price";

/**
 * The WhatsApp bag: a bottom sheet on phones, a side panel on desktop. It
 * holds ids only; products are re-fetched so prices are always current.
 * "Send order on WhatsApp" opens WhatsApp with every line pre-written.
 */
export default function BagDrawer() {
  const open = useShop((s) => s.bagOpen);
  const setOpen = useShop((s) => s.setBagOpen);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close bag"
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            className="fixed z-50 bg-ivory text-charcoal flex flex-col inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl md:inset-y-0 md:right-0 md:left-auto md:w-[440px] md:max-h-none md:rounded-none"
            initial={{ y: "100%", x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.55, ease: EASE.outExpo }}
          >
            <BagContents onClose={() => setOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function BagContents({ onClose, page = false }: { onClose?: () => void; page?: boolean }) {
  const bag = useShop((s) => s.bag);
  const setQty = useShop((s) => s.setQty);
  const remove = useShop((s) => s.removeFromBag);
  const prune = useShop((s) => s.pruneMissing);
  const count = useShop(selectBagCount);
  const site = useSite();
  const ids = useMemo(() => bag.map((b) => b.id), [bag]);
  const { data: products, loading } = useFetch((signal) => api.productsByIds(ids, signal), ids.join(","), ids.length > 0);

  // A product deleted from the catalog disappears from the bag quietly.
  useEffect(() => {
    if (!products || loading) return;
    const have = new Set(products.map((p) => p.id));
    const missing = ids.filter((id) => !have.has(id));
    if (missing.length) prune(missing);
  }, [products, loading, ids, prune]);

  const lines = (products ?? []).map((p) => ({ product: p, qty: bag.find((b) => b.id === p.id)?.qty ?? 1 }));
  const total = lines.reduce((s, l) => s + effectivePrice(l.product) * l.qty, 0);

  return (
    <>
      {!page && (
        <div className="flex items-center justify-between gutter md:px-6 h-14 border-b border-line shrink-0">
          <h2 className="font-display text-xl">Your bag <span className="text-muted text-base font-sans">({count})</span></h2>
          <button type="button" onClick={onClose} className="-mr-2 p-2" aria-label="Close">
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${page ? "" : "gutter md:px-6"} py-4`}>
        {bag.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-display text-2xl mb-2">Your bag is empty</p>
            <p className="text-muted text-[15px] mb-6">Add a few pieces, then send them all to us in one WhatsApp message.</p>
            <ButtonLink to="/women" variant="secondary">Browse women</ButtonLink>
            <span className="inline-block w-2" />
            <ButtonLink to="/men" variant="secondary">Browse men</ButtonLink>
          </div>
        ) : loading && !products ? (
          <ul className="space-y-4">{ids.map((id) => <li key={id} className="h-24 animate-pulse bg-bone rounded-card" />)}</ul>
        ) : (
          <ul className="divide-y divide-line">
            {lines.map(({ product, qty }) => {
              const img = product.images[0] ?? (product.image_urls[0] ? { url: product.image_urls[0] } : null);
              const src = img ? imageSource(img, 400, product.name) : null;
              return (
                <li key={product.id} className="flex gap-4 py-4">
                  <Link to={`/product/${product.id}`} onClick={onClose} className="w-20 shrink-0 aspect-[4/5] overflow-hidden rounded-card bg-bone">
                    {src && <img src={src.src} srcSet={src.srcSet} sizes="80px" alt={src.alt} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`} onClick={onClose} className="text-[15px] leading-snug line-clamp-2 hover:opacity-70">{product.name}</Link>
                    <p className="text-xs text-muted mt-0.5">{[product.fabric, product.color].filter(Boolean).join(" · ")}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-line rounded-pill">
                        <button type="button" onClick={() => setQty(product.id, qty - 1)} className="h-9 w-9 grid place-items-center" aria-label="Decrease quantity"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                        <button type="button" onClick={() => setQty(product.id, qty + 1)} className="h-9 w-9 grid place-items-center" aria-label="Increase quantity"><Plus size={14} /></button>
                      </div>
                      <Price product={product} />
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(product.id)} className="self-start p-2 -mr-2 text-muted hover:text-sale" aria-label={`Remove ${product.name}`}>
                    <Trash2 size={16} strokeWidth={1.6} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {bag.length > 0 && (
        <div className={`shrink-0 border-t border-line ${page ? "" : "gutter md:px-6"} py-4 space-y-3 bg-ivory`} style={{ paddingBottom: page ? undefined : "max(16px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-muted">Estimated total</span>
            <span className="font-medium text-lg">{formatPrice(total)}</span>
          </div>
          <ButtonAnchor
            href={lines.length ? whatsappUrl(site.whatsapp, bagMessage(lines)) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full"
            aria-disabled={lines.length === 0}
          >
            <MessageCircle size={18} /> Send order on WhatsApp
          </ButtonAnchor>
          <p className="text-xs text-muted text-center text-pretty">Opens WhatsApp with your pieces listed. We confirm stock, delivery and payment in the chat — nothing is charged here.</p>
        </div>
      )}
    </>
  );
}
