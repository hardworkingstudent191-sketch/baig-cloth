import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { storefrontRoutes } from "./storefront/routes";
import { adminRoutes } from "./admin/routes";
import ErrorPage from "./ErrorPage";

/**
 * Pathless layout route wrapping both route trees.
 *
 * It exists for two things that have to live *inside* the router:
 *  - <ScrollRestoration>, which scrolls to the top on a new navigation and
 *    restores the previous offset on back/forward. Without it, tapping a
 *    product halfway down a category grid opened the product page already
 *    scrolled to the middle of the description.
 *  - errorElement, so a render-time crash shows a real page instead of
 *    React Router's raw developer error screen.
 */
function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [...storefrontRoutes, ...adminRoutes],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
