import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { usePageMeta } from "../lib/usePageMeta";
import { useJsonLd } from "../lib/useJsonLd";
import Hero from "../components/home/Hero";
import { Marquee, ShopBy, CollectionsRail, RailSection, ColourWall, HowItWorks, SaleStrip, Testimonials, InstagramGrid, StoreBlock } from "../components/home/Sections";
import { Skeleton, ProductGridSkeleton } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";

/**
 * Everything on the homepage comes from one request (/home); the colour
 * wall adds one more for the wash & wear family. Sections render as the
 * data arrives — the hero never waits for the rest.
 */
export default function HomePage() {
  const { data, loading, error, reload } = useFetch((signal) => api.home(signal), "home");
  const { data: washWear } = useFetch((signal) => api.products({ fabric: "Wash & Wear", limit: 60, sort: "name" }, signal), "wash-wear");

  usePageMeta({
    title: "",
    description: "Hand-picked lawn, cotton, wash & wear and embroidered unstitched fabric for men and women in Faisalabad. Browse the collection and order over WhatsApp.",
  });
  useJsonLd(
    data
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Baig Cloth",
          url: window.location.origin,
          logo: `${window.location.origin}/icon-512.png`,
          sameAs: Object.values(data.site.social),
          contactPoint: { "@type": "ContactPoint", telephone: `+${data.site.whatsapp}`, contactType: "sales", areaServed: "PK", availableLanguage: ["en", "ur"] },
        }
      : null,
  );

  if (error && !data) {
    return (
      <div>
        <Hero slides={[]} />
        <div className="gutter py-16"><ErrorState message={error.message} onRetry={reload} /></div>
      </div>
    );
  }

  return (
    <div>
      <Hero slides={data?.slides ?? []} />
      <Marquee items={["Lawn", "Cotton", "Wash & Wear", "Embroidered", "Karandi", "Order on WhatsApp", "Delivery across Pakistan", "Faisalabad"]} />

      {loading || !data ? (
        <div className="gutter pt-14 space-y-12" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 md:gap-6"><Skeleton className="aspect-[3/4]" /><Skeleton className="aspect-[3/4]" /></div>
          <ProductGridSkeleton count={4} />
        </div>
      ) : (
        <>
          <ShopBy counts={data.counts} featured={data.featured.length ? data.featured : data.new_arrivals} />
          <RailSection eyebrow="Just arrived" title="New in" link="/new" products={data.new_arrivals} />
          <CollectionsRail collections={data.collections} />
          <ColourWall products={washWear?.items ?? []} />
          <RailSection eyebrow="Our picks" title="Featured pieces" link="/women" products={data.featured} />
          <SaleStrip sale={data.sale} />
          <HowItWorks site={data.site} />
          <Testimonials items={data.testimonials} />
          <InstagramGrid posts={data.instagram} handle={data.site.social.instagram} />
          <StoreBlock site={data.site} />
        </>
      )}
    </div>
  );
}
