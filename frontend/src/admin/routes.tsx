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

import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import RequireAuth from "./RequireAuth";

// Every admin screen — CRUD forms, the dashboard, the category manager —
// is lazy-loaded into its own chunk. The overwhelming majority of visitors
// are storefront customers who never touch /admin; before this, all of that
// code (and the CRUD form logic, validation, etc.) shipped in the same JS
// bundle they had to download just to see the homepage.
const AdminLogin = lazy(() => import("./AdminLogin"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const ProductForm = lazy(() => import("./ProductForm"));
const CategoryManager = lazy(() => import("./CategoryManager"));
const AccountPage = lazy(() => import("./AccountPage"));

function AdminSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#6b7280]">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin/login",
    element: (
      <AdminSuspense>
        <AdminLogin />
      </AdminSuspense>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <AdminSuspense>
          <AdminDashboard />
        </AdminSuspense>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/products/new",
    element: (
      <RequireAuth>
        <AdminSuspense>
          <ProductForm />
        </AdminSuspense>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/products/:id/edit",
    element: (
      <RequireAuth>
        <AdminSuspense>
          <ProductForm />
        </AdminSuspense>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/categories",
    element: (
      <RequireAuth>
        <AdminSuspense>
          <CategoryManager />
        </AdminSuspense>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/account",
    element: (
      <RequireAuth>
        <AdminSuspense>
          <AccountPage />
        </AdminSuspense>
      </RequireAuth>
    ),
  },
];
