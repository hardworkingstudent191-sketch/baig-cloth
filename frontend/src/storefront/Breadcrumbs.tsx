import { Link } from "react-router-dom";
import { useJsonLd } from "../useJsonLd";

export interface Crumb {
  label: string;
  to?: string; // omit on the final (current-page) crumb
}

/**
 * Visible breadcrumb trail plus its matching BreadcrumbList JSON-LD.
 * Google can render breadcrumbs directly in the search result for the
 * matching crumb structure, so the two need to describe the same path.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.to ? { item: window.location.origin + item.to } : {}),
    })),
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[#6b7280]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-[#223c80] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#1f2937]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
