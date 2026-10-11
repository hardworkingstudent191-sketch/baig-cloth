import { usePageMeta } from "../lib/usePageMeta";
import { ButtonLink } from "../components/ui/Button";

export default function NotFoundPage() {
  usePageMeta({ title: "Page not found", noindex: true });
  return (
    <div className="gutter py-24 md:py-40 text-center">
      <p className="eyebrow text-muted mb-3">404</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">This page doesn't exist.</h1>
      <p className="text-muted mb-8 max-w-sm mx-auto text-pretty">The link might be broken, or the piece may have sold out and been removed.</p>
      <div className="flex items-center justify-center gap-3">
        <ButtonLink to="/women">Shop women</ButtonLink>
        <ButtonLink to="/men" variant="secondary">Shop men</ButtonLink>
      </div>
    </div>
  );
}
