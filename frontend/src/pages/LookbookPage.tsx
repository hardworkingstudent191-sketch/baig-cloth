import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import { images } from "../generated/media";
import { EASE } from "../lib/motion";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { CollectionCard } from "./CollectionsPage";
import { Skeleton } from "../components/ui/Skeleton";
import Img from "../components/ui/Img";

/**
 * Editorial lookbook: lifestyle imagery (placeholders until the shop's own
 * shoot) interleaved with collection tiles. Images reveal with a clip-path
 * wipe; the grid breaks rhythm with one wide image per row group.
 */
export default function LookbookPage() {
  const { data: collections, loading } = useFetch((signal) => api.collections(signal), "collections");
  usePageMeta({ title: "Lookbook", description: "Baig Cloth lookbook — our fabric, worn and styled." });
  const shots = Object.entries(images).filter(([k]) => k.startsWith("lookbook-")).map(([, v]) => v);

  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Lookbook" }]} eyebrow="Season" title="Lookbook" intro="Our fabric, worn. Tap a collection to shop the pieces." />
      <div className="gutter">
        {shots.length === 0 && (
          <p className="text-sm text-muted mb-8">Lookbook photography is being shot — in the meantime, the collections below show every piece.</p>
        )}
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {shots.map((img, i) => {
            const wide = i % 5 === 0;
            return (
              <li key={img.src} className={wide ? "col-span-2 md:col-span-2 md:row-span-2" : ""}>
                <motion.div
                  initial={{ clipPath: "inset(100% 0 0 0)" }}
                  whileInView={{ clipPath: "inset(0% 0 0 0)" }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 1.1, ease: EASE.outExpo, delay: (i % 4) * 0.06 }}
                  className={`overflow-hidden rounded-card bg-bone ${wide ? "aspect-[4/5] md:h-full" : "aspect-[4/5]"}`}
                >
                  <Img src={img.src} srcSet={img.srcSet} sizes={wide ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} alt={img.alt} loading={i < 3 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
                </motion.div>
              </li>
            );
          })}
        </ul>

        <section className="mt-16 md:mt-24">
          <Reveal className="flex items-end justify-between mb-6 md:mb-10">
            <h2 className="font-display text-3xl md:text-4xl">Shop the collections</h2>
            <Link to="/collections" className="text-sm font-medium hidden sm:inline">All collections</Link>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {(collections ?? []).map((c, i) => <CollectionCard key={c.id} c={c} index={i} />)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
