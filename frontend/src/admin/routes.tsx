// Drop this into your existing router config (e.g. src/App.tsx or wherever
// your <Routes> tree lives). Example with React Router 7 / createBrowserRouter:
//
//   import { adminRoutes } from "./admin/routes";
//   const router = createBrowserRouter([
//     ...yourExistingStorefrontRoutes,
//     ...adminRoutes,
//   ]);
//
// Or, if using <Routes>/<Route> directly:
//
//   <Routes>
//     {...your storefront routes...}
//     <Route path="/admin/login" element={<AdminLogin />} />
//     <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
//     <Route path="/admin/products/new" element={<RequireAuth><ProductForm /></RequireAuth>} />
//     <Route path="/admin/products/:id/edit" element={<RequireAuth><ProductForm /></RequireAuth>} />
//     <Route path="/admin/categories" element={<RequireAuth><CategoryManager /></RequireAuth>} />
//   </Routes>

import type { RouteObject } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import ProductForm from "./ProductForm";
import CategoryManager from "./CategoryManager";
import RequireAuth from "./RequireAuth";

export const adminRoutes: RouteObject[] = [
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <AdminDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/products/new",
    element: (
      <RequireAuth>
        <ProductForm />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/products/:id/edit",
    element: (
      <RequireAuth>
        <ProductForm />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/categories",
    element: (
      <RequireAuth>
        <CategoryManager />
      </RequireAuth>
    ),
  },
];
