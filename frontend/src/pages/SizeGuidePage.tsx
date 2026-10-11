import { usePageMeta } from "../lib/usePageMeta";
import { useSite } from "../lib/site";
import { whatsappUrl } from "../lib/whatsapp";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { ButtonAnchor } from "../components/ui/Button";

const STEPS = [
  { n: "01", title: "Chest / bust", body: "Around the fullest part, tape level, not tight. Add 2–3 inches of ease for a comfortable kameez." },
  { n: "02", title: "Shoulder", body: "Across the back, from the edge of one shoulder to the other." },
  { n: "03", title: "Kameez length", body: "From the top of the shoulder down to where you want the hem — knee-length is the usual starting point." },
  { n: "04", title: "Sleeve", body: "From the shoulder edge to the wrist bone, arm slightly bent." },
  { n: "05", title: "Waist & hip", body: "Around the natural waist, and around the fullest part of the hips." },
  { n: "06", title: "Trouser / shalwar length", body: "From the waist down to the ankle bone." },
];

const WOMEN = [
  ["Size", "Bust", "Waist", "Hip", "Length"],
  ["XS", "32", "26", "35", "38"],
  ["S", "34", "28", "37", "39"],
  ["M", "36", "30", "39", "40"],
  ["L", "38", "32", "41", "41"],
  ["XL", "40", "34", "43", "42"],
];
const MEN = [
  ["Size", "Chest", "Shoulder", "Kameez length", "Shalwar length"],
  ["S", "38", "17", "40", "40"],
  ["M", "40", "18", "41", "41"],
  ["L", "42", "19", "42", "42"],
  ["XL", "44", "20", "43", "43"],
];

function Table({ rows, caption }: { rows: string[][]; caption: string }) {
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto -mx-[var(--page-gutter)] px-[var(--page-gutter)] md:mx-0 md:px-0">
      <table className="w-full min-w-[460px] text-sm border-y border-line">
        <caption className="text-left eyebrow text-muted mb-3">{caption} · inches</caption>
        <thead>
          <tr>{head.map((h) => <th key={h} className="text-left font-medium py-2.5 pr-4 border-b border-line">{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r) => (
            <tr key={r[0]} className="border-b border-line/70 last:border-0">
              {r.map((c, i) => <td key={i} className={`py-2.5 pr-4 ${i === 0 ? "font-medium" : "text-muted"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  const site = useSite();
  usePageMeta({ title: "Size & measurement guide", description: "How to measure for unstitched fabric and how much you need — Baig Cloth's guide to kameez, shalwar and trouser lengths." });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Size guide" }]} eyebrow="Unstitched, made to measure" title="Size & measurement guide" intro="Unstitched fabric is cut and stitched to you. Every piece lists how many metres it includes; this is how to know it's enough — and what to tell your tailor." />
      <div className="gutter space-y-16">
        <section>
          <Reveal><h2 className="font-display text-2xl md:text-3xl mb-6">How much fabric?</h2></Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Women's 3-piece", "Shirt 3 m · Trouser 2.5 m · Dupatta 2.5 m", "Standard for a kameez up to 42\" long with full sleeves. Larger sizes or longer lengths: ask for 3.25 m shirt."],
              ["Men's 2-piece", "Shirt 2.5 m · Shalwar 2.5 m (or 4.25–4.5 m suit length)", "Enough for a kameez up to 44\" long. Sizes above XL or extra-long: look for 4.5 m suit lengths."],
              ["Ask us", "Not sure?", "Send your chest, length and height on WhatsApp — we'll confirm the metres before you order."],
            ].map(([t, m, b], i) => (
              <Reveal key={t} delay={i * 0.07} className="rounded-card border border-line p-5 md:p-6 bg-bone/40">
                <p className="eyebrow text-muted mb-2">{t}</p>
                <p className="font-display text-xl mb-2">{m}</p>
                <p className="text-sm text-muted text-pretty">{b}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal><h2 className="font-display text-2xl md:text-3xl mb-6">How to measure</h2></Reveal>
          <ol className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} as="li" delay={(i % 2) * 0.06} className="flex gap-5">
                <span className="font-display text-3xl text-sand leading-none">{s.n}</span>
                <div>
                  <h3 className="font-medium mb-1">{s.title}</h3>
                  <p className="text-sm text-muted text-pretty">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="grid gap-12 lg:grid-cols-2">
          <Reveal><Table rows={WOMEN} caption="Women — typical stitched sizes" /></Reveal>
          <Reveal delay={0.08}><Table rows={MEN} caption="Men — typical stitched sizes" /></Reveal>
        </section>

        <Reveal className="rounded-card bg-charcoal text-ivory p-7 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl md:text-3xl mb-1">Send us your measurements</p>
            <p className="text-ivory/70 text-[15px]">We'll confirm the fabric you need before you order.</p>
          </div>
          <ButtonAnchor href={whatsappUrl(site.whatsapp, "Assalam o Alaikum! I'd like help choosing how much fabric I need. My measurements are: ")} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg">Ask on WhatsApp</ButtonAnchor>
        </Reveal>
      </div>
    </div>
  );
}
