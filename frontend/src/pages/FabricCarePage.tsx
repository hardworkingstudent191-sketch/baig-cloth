import { usePageMeta } from "../lib/usePageMeta";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";

const FABRICS = [
  { name: "Lawn", feel: "Light, breathable, printed — the summer staple.", care: ["Hand wash or gentle machine cycle, cold water, inside out.", "No bleach; dry in shade to keep the print vivid.", "Iron on medium while slightly damp."] },
  { name: "Cotton", feel: "Crisp and cool; softens with every wash.", care: ["Machine wash cold with similar colours.", "Line dry; expect a little shrinkage on the first wash.", "Iron medium-high while damp."] },
  { name: "Wash & Wear", feel: "Poly-viscose blend that resists creasing — the everyday shalwar-kameez.", care: ["Machine wash cold, gentle cycle.", "Tumble dry low or line dry; it barely creases.", "Warm iron only if needed."] },
  { name: "Embroidered", feel: "Net, chiffon or lawn with thread, sequin or bead work.", care: ["Dry clean recommended.", "If hand washing: cold water, mild detergent, inside out, never wring; dry flat in shade.", "Iron inside out on low with a cloth, avoiding the embroidery."] },
  { name: "Karandi", feel: "Warm, textured winter weave.", care: ["Dry clean recommended; hand wash cold if needed, don't wring.", "Dry in shade.", "Iron medium with a pressing cloth."] },
];

export default function FabricCarePage() {
  usePageMeta({ title: "Fabric care", description: "How to wash, dry and iron lawn, cotton, wash & wear, embroidered and karandi fabric so it lasts." });
  return (
    <div className="pb-8">
      <PageHeader crumbs={[{ label: "Fabric care" }]} eyebrow="Make it last" title="Fabric care" intro="Good fabric lasts years with a little care. Here's what each of ours likes." />
      <div className="gutter">
        <ul className="divide-y divide-line border-y border-line">
          {FABRICS.map((f, i) => (
            <Reveal key={f.name} as="li" delay={i * 0.04} className="grid gap-3 py-7 md:py-9 md:grid-cols-12">
              <div className="md:col-span-4">
                <h2 className="font-display text-2xl md:text-3xl">{f.name}</h2>
                <p className="text-sm text-muted mt-1 text-pretty">{f.feel}</p>
              </div>
              <ol className="md:col-span-8 space-y-2 text-[15px]">
                {f.care.map((c, j) => (
                  <li key={j} className="flex gap-3"><span className="text-sand font-display">{j + 1}.</span><span className="text-pretty">{c}</span></li>
                ))}
              </ol>
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-10 text-sm text-muted max-w-2xl text-pretty">
          General rule: wash dark and bright colours separately the first few times, never leave fabric soaking, and store folded in a dry cupboard away from direct sun.
        </Reveal>
      </div>
    </div>
  );
}
