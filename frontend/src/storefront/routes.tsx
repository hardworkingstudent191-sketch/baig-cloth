import type { RouteObject } from "react-router-dom";
import HomePage from "./HomePage";
import CategoryPage from "./CategoryPage";
import ProductPage from "./ProductPage";
import SalePage from "./SalePage";
import PoliciesPage from "./PoliciesPage";
import AboutPage from "./AboutPage";
import SearchPage from "./SearchPage";
import NotFoundPage from "./NotFoundPage";

export const storefrontRoutes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/men", element: <CategoryPage gender="men" /> },
  { path: "/men/:category", element: <CategoryPage gender="men" /> },
  { path: "/women", element: <CategoryPage gender="women" /> },
  { path: "/women/:category", element: <CategoryPage gender="women" /> },
  { path: "/product/:id", element: <ProductPage /> },
  { path: "/sale", element: <SalePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/policies", element: <PoliciesPage /> },
  { path: "/about", element: <AboutPage /> },
  // Catch-all: without this, an unmatched URL (including any bad/old link)
  // rendered React Router's raw default error screen instead of a normal
  // 404 page. Keep this last — route order matters.
  { path: "*", element: <NotFoundPage /> },
];
