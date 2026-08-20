// Merge into your router alongside adminRoutes from src/admin/routes.tsx.
//
//   import { storefrontRoutes } from "./storefront/routes";
//   import { adminRoutes } from "./admin/routes";
//   const router = createBrowserRouter([...storefrontRoutes, ...adminRoutes]);

import type { RouteObject } from "react-router-dom";
import HomePage from "./HomePage";
import CategoryPage from "./CategoryPage";
import ProductPage from "./ProductPage";
import SalePage from "./SalePage";

export const storefrontRoutes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/men", element: <CategoryPage gender="men" /> },
  { path: "/men/:category", element: <CategoryPage gender="men" /> },
  { path: "/women", element: <CategoryPage gender="women" /> },
  { path: "/women/:category", element: <CategoryPage gender="women" /> },
  { path: "/product/:id", element: <ProductPage /> },
  { path: "/sale", element: <SalePage /> },
  // /policies and /about are content pages — build once copy is ready (see to-do list Phase 4)
];
