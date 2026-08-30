import { Link } from "react-router-dom";
import StorefrontLayout from "./StorefrontLayout";
import { usePageMeta } from "../usePageMeta";

export default function NotFoundPage() {
  usePageMeta({ title: "Page Not Found", noindex: true });

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="font-mono text-xs tracking-[0.25em] text-[#6b7280] uppercase mb-4">404</p>
        <h1 className="font-serif text-3xl mb-3">This page doesn't exist.</h1>
        <p className="text-[#1f2937] text-sm mb-6">
          The link might be broken, or the page may have moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-[#223c80] text-[#f7f7f5] px-6 py-3 rounded text-sm hover:bg-[#2d4d9e] transition-colors"
        >
          Back to shop
        </Link>
      </div>
    </StorefrontLayout>
  );
}
