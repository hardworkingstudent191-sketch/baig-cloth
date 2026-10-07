import { useEffect, useRef } from "react";
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from "react-router-dom";
import { storefrontRoutes } from "./storefront/routes";
import { adminRoutes } from "./admin/routes";
import { ADMIN_ENABLED } from "./config";
import ErrorPage from "./ErrorPage";

/**
 * Pathless layout route wrapping both route trees.
 *
 * It exists for three things that have to live *inside* the router:
 *  - <ScrollRestoration>, which scrolls to the top on a new navigation and
 *    restores the previous offset on back/forward. Without it, tapping a
 *    product halfway down a category grid opened the product page already
 *    scrolled to the middle of the description.
 *  - errorElement, so a render-time crash shows a real page instead of
 *    React Router's raw developer error screen.
 *  - a page-enter fade on every navigation (below) — applies to both route
 *    trees, storefront and admin alike, from this one place.
 */
function RootLayout() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Restart the CSS animation on every navigation by removing and
    // re-adding its class, forcing a reflow in between — this wrapper div
    // itself is never unmounted (it's part of the persistent layout), so a
    // plain class toggle wouldn't otherwise replay the animation. The
    // Outlet's actual page component still mounts/unmounts or updates
    // exactly as React Router would do it anyway; this only restarts the
    // fade on the stable wrapper around it.
    el.classList.remove("page-enter");
    void el.offsetWidth;
    el.classList.add("page-enter");
  }, [location.pathname]);

  return (
    <>
      <ScrollRestoration />
      <div ref={ref} className="page-enter">
        <Outlet />
      </div>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    // Admin routes are only mounted when the backend is one the React admin
    // can talk to (see config.ts); otherwise /admin/* falls through to the
    // storefront's 404 page instead of a login form that can never work.
    children: [...storefrontRoutes, ...(ADMIN_ENABLED ? adminRoutes : [])],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
