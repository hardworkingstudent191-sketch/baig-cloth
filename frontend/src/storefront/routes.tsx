import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import HomePage from "./HomePage";
import CategoryPage from "./CategoryPage";
import ProductPage from "./ProductPage";
import StorefrontLayout from "./StorefrontLayout";

// The three pages on the buying path — home → category → product — stay in
// the main bundle so the first navigation is instant. Everything else is
// its own chunk, fetched on first visit: a visitor who never opens
// /policies shouldn't download the FAQ accordion, and the same goes for the
// wishlist, search, sale and about pages. Same pattern as admin/routes.tsx.
const SalePage = lazy(() => import("./SalePage"));
const SearchPage = lazy(() => import("./SearchPage"));
const WishlistPage = lazy(() => import("./WishlistPage"));
const PoliciesPage = lazy(() => import("./PoliciesPage"));
const AboutPage = lazy(() => import("./AboutPage"));
const NotFoundPage = lazy(() => import("./NotFoundPage"));

function Deferred({ children }: { children: ReactNode }) {
  // The fallback keeps header/footer in place so a chunk load never flashes
  // an empty page — only the content area waits, and only on the first
  // visit to that route (chunks are cached after that).
  return (
    <Suspense
      fallback={
        <StorefrontLayout>
          <div className="max-w-6xl mx-auto px-4 py-16 text-sm text-[#6b7280]" aria-busy="true">
            Loading…
          </div>
        </StorefrontLayout>
      }
    >
      {children}
    </Suspense>
  );
}

export const storefrontRoutes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/men", element: <CategoryPage gender="men" /> },
  { path: "/men/:category", element: <CategoryPage gender="men" /> },
  { path: "/women", element: <CategoryPage gender="women" /> },
  { path: "/women/:category", element: <CategoryPage gender="women" /> },
  { path: "/product/:id", element: <ProductPage /> },
  { path: "/sale", element: <Deferred><SalePage /></Deferred> },
  { path: "/search", element: <Deferred><SearchPage /></Deferred> },
  { path: "/wishlist", element: <Deferred><WishlistPage /></Deferred> },
  { path: "/policies", element: <Deferred><PoliciesPage /></Deferred> },
  { path: "/about", element: <Deferred><AboutPage /></Deferred> },
  // Catch-all: without this, an unmatched URL (including any bad/old link)
  // rendered React Router's raw default error screen instead of a normal
  // 404 page. Keep this last — route order matters.
  { path: "*", element: <Deferred><NotFoundPage /></Deferred> },
];
