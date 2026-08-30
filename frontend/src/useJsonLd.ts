import { useEffect } from "react";

/**
 * Injects one `<script type="application/ld+json">` tag into <head> for as
 * long as the calling component is mounted, then removes it.
 *
 * Structured data (schema.org via JSON-LD) is what lets Google show rich
 * results — price/availability on a product, breadcrumbs in the search
 * result itself — instead of just a plain blue link. Passing `null` skips
 * rendering (e.g. ProductPage before the fetch resolves).
 */
export function useJsonLd(data: object | null) {
  useEffect(() => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
    // Re-stringify each render is cheap and avoids a footgun where a caller
    // passes a fresh object literal every render (the common case) but we
    // only diff by reference and never update the injected tag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
}
