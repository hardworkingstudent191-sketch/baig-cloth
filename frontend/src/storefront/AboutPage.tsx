import { Link } from "react-router-dom";
import StorefrontLayout from "./StorefrontLayout";
import { usePageMeta } from "../usePageMeta";
import Reveal from "../Reveal";
import FabricVideoCard from "./FabricVideoCard";

export default function AboutPage() {
  usePageMeta({
    title: "About",
    description:
      "Baig Cloth hand-picks lawn, cotton and embroidered unstitched fabric for men and women, and keeps ordering as simple as sending a WhatsApp message.",
  });

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Reveal>
          <h1 className="font-serif text-3xl mb-6">About Baig Cloth</h1>
        </Reveal>

        <Reveal delayMs={80}>
          <FabricVideoCard className="mb-8" />
        </Reveal>

        <Reveal delayMs={140}>
          <div className="space-y-4 text-sm text-[#1f2937] leading-relaxed">
            <p>
              Baig Cloth is built around a simple idea: good fabric shouldn't be complicated to
              find. We hand-pick lawn, cotton, and embroidered unstitched pieces for men and women,
              and keep the whole process — from browsing to ordering — as straightforward as
              sending a message.
            </p>
            <p>
              No accounts, no checkout forms. Find a piece you like, message us on WhatsApp, and
              we'll take it from there.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={200}>
          <div className="flex gap-3 mt-8">
            <Link
              to="/women"
              className="bg-[#223c80] text-[#f7f7f5] px-6 py-3 rounded text-sm hover:bg-[#2d4d9e] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#223c80]/20 transition-all duration-200"
            >
              Shop Women
            </Link>
            <Link
              to="/men"
              className="border border-[#101014] px-6 py-3 rounded text-sm hover:bg-[#101014] hover:text-[#f7f7f5] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101014]/10 transition-all duration-200"
            >
              Shop Men
            </Link>
          </div>
        </Reveal>
      </div>
    </StorefrontLayout>
  );
}
