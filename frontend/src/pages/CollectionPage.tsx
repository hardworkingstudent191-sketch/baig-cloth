import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import { useDeferredMedia } from "../lib/useDeferredMedia";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { EASE } from "../lib/motion";
import ProductGrid from "../components/product/ProductGrid";
import { ProductGridSkeleton, Skeleton } from "../components/ui/Skeleton";
import ErrorState, { EmptyState } from "../components/ui/ErrorState";
import { RevealLines } from "../components/ui/Reveal";
import NotFoundPage from "./NotFoundPage";
import Img from "../components/ui/Img";

/** A collection: full-bleed cover (video if it has one) with the name set in, then its pieces. */
export default function CollectionPage() {
  const { slug = "" } = useParams();
  const { data, loading, error, notFound, reload } = useFetch((signal) => api.collection(slug, signal), `collection-${slug}`);
  const mediaReady = useDeferredMedia();
  const reduced = usePrefersReducedMotion();
  usePageMeta({ title: loading ? null : data ? data.name : "Collection", description: data?.tagline || data?.description || undefined });

  if (notFound) return <NotFoundPage />;

  return (
    <div className="pb-8">
      <section className="relative -mt-[var(--header-h)] h-[72dvh] min-h-[480px] md:h-[78vh] overflow-hidden bg-charcoal text-ivory">
        {loading ? (
          <Skeleton className="absolute inset-0 rounded-none bg-charcoal/60" />
        ) : data?.video && mediaReady && !reduced ? (
          <video className="absolute inset-0 h-full w-full object-cover" src={data.video} poster={data.cover || undefined} autoPlay muted loop playsInline />
        ) : data?.cover ? (
          <motion.img onError={(e) => { e.currentTarget.style.display = "none"; }} src={data.cover} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: EASE.outExpo }} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 gutter pb-10 md:pb-16">
          {data && (
            <>
              <p className="eyebrow text-ivory/70 mb-3">{data.count} {data.count === 1 ? "piece" : "pieces"}{data.gender !== "all" ? ` · ${data.gender}` : ""}</p>
              <h1 className="font-display text-[2.8rem] md:text-[4.5rem] leading-[0.98] text-balance max-w-3xl">
                <RevealLines lines={[data.name]} delay={0.2} />
              </h1>
              {data.tagline && (
                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.5 }} className="mt-4 text-base md:text-lg text-ivory/85 max-w-xl text-pretty">
                  {data.tagline}
                </motion.p>
              )}
            </>
          )}
        </div>
      </section>

      <div className="gutter pt-10 md:pt-16">
        {data?.description && <p className="max-w-2xl text-[15px] md:text-base text-muted mb-10 text-pretty">{data.description}</p>}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : !data || data.products.length === 0 ? (
          <EmptyState title="This collection is being filled" body="Pieces are on their way — check back soon." />
        ) : (
          <ProductGrid products={data.products} />
        )}
      </div>
    </div>
  );
}
