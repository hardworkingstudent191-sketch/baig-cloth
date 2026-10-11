import { MessageCircle, Scissors, Truck, HandCoins } from "lucide-react";
import { motion } from "motion/react";
import { usePageMeta } from "../lib/usePageMeta";
import { useSite } from "../lib/site";
import { useDeferredMedia } from "../lib/useDeferredMedia";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { EASE } from "../lib/motion";
import { videos, images } from "../generated/media";
import Reveal, { RevealLines } from "../components/ui/Reveal";
import { ButtonLink } from "../components/ui/Button";
import Img from "../components/ui/Img";

const VALUES = [
  { icon: Scissors, title: "Chosen by hand", body: "Every bolt is picked in person — for the hand-feel, the weight and how it will stitch, not just how it photographs." },
  { icon: MessageCircle, title: "A conversation, not a checkout", body: "You talk to a person. Ask for close-ups, compare colours, get advice on metres — then order in the same chat." },
  { icon: Truck, title: "Delivered across Pakistan", body: "Cut, folded and dispatched from Faisalabad to your door, usually within 3–5 working days." },
  { icon: HandCoins, title: "Fair, plain prices", body: "Textile-city prices without the bazaar haggle. What you see is what you pay." },
];

export default function AboutPage() {
  const site = useSite();
  const mediaReady = useDeferredMedia();
  const reduced = usePrefersReducedMotion();
  const video = videos["story-fabric"] ?? videos["hero-fabric"];
  const still = images["story-shop"];
  usePageMeta({ title: "Our story", description: site.about_story.slice(0, 155) });
  const paragraphs = (site.about_story || "").split(/\n+/).filter(Boolean);

  return (
    <div className="pb-8">
      <section className="relative -mt-[var(--header-h)] h-[70dvh] min-h-[460px] overflow-hidden bg-charcoal text-ivory">
        {video && mediaReady && !reduced ? (
          <video className="absolute inset-0 h-full w-full object-cover" poster={video.poster} autoPlay muted loop playsInline>
            <source src={video.src720} media="(max-width: 767px)" type="video/mp4" />
            <source src={video.src1080} type="video/mp4" />
          </video>
        ) : video ? (
          <Img src={video.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video className="absolute inset-0 h-full w-full object-cover" poster="/hero/fabric-flow-poster.jpg" src={mediaReady && !reduced ? "/hero/fabric-flow.mp4" : undefined} autoPlay muted loop playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30" />
        <div className="absolute inset-x-0 bottom-0 gutter pb-10 md:pb-16">
          <p className="eyebrow text-ivory/70 mb-3">{site.established ? `Faisalabad · since ${site.established}` : "Faisalabad"}</p>
          <h1 className="font-display text-[2.8rem] md:text-[4.5rem] leading-[0.98] max-w-3xl text-balance">
            <RevealLines lines={["Cloth worth cutting", "into something of your own."]} delay={0.2} />
          </h1>
        </div>
      </section>

      <section className="gutter py-14 md:py-24 grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-muted mb-3">Our story</p>
          <h2 className="font-display text-3xl md:text-4xl leading-tight text-balance">Good fabric shouldn't be complicated to find.</h2>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7 lg:pt-12 space-y-5 text-[16px] md:text-lg leading-relaxed text-charcoal/85">
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i} className="text-pretty">{p}</p>) : <p>Baig Cloth is a family fabric shop in Faisalabad. We hand-pick unstitched pieces for men and women and keep ordering as simple as a WhatsApp message.</p>}
        </Reveal>
      </section>

      {still && (
        <section className="gutter">
          <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} whileInView={{ clipPath: "inset(0 0 0% 0)" }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.2, ease: EASE.outExpo }} className="overflow-hidden rounded-card">
            <Img src={still.src} srcSet={still.srcSet} sizes="100vw" alt={still.alt} className="w-full aspect-[16/9] md:aspect-[21/9] object-cover" loading="lazy" />
          </motion.div>
        </section>
      )}

      <section className="gutter py-14 md:py-24">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} as="li" delay={i * 0.07}>
              <v.icon size={26} strokeWidth={1.3} className="mb-4 text-navy" />
              <h3 className="font-display text-xl mb-2">{v.title}</h3>
              <p className="text-sm text-muted text-pretty leading-relaxed">{v.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="gutter">
        <Reveal className="rounded-card bg-bone p-8 md:p-14 text-center">
          <p className="font-display text-3xl md:text-4xl mb-3 text-balance">See the fabric for yourself</p>
          <p className="text-muted mb-6">Browse the collection, or visit us in {site.city}.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to="/women">Shop women</ButtonLink>
            <ButtonLink to="/men" variant="secondary">Shop men</ButtonLink>
            <ButtonLink to="/store" variant="ghost">Visit the shop</ButtonLink>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
