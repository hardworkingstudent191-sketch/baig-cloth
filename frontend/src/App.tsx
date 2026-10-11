import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from "react-router-dom";
import { SiteProvider } from "./lib/site";
import { useSmoothScroll } from "./lib/motion";
import { useShop } from "./lib/store";
import Layout from "./components/layout/Layout";
import ErrorPage from "./pages/ErrorPage";
import PageSkeleton from "./components/ui/PageSkeleton";

// Every route is its own chunk: a phone on mobile data downloads the
// homepage, not the whole site.
const HomePage = lazy(() => import("./pages/HomePage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const LookbookPage = lazy(() => import("./pages/LookbookPage"));
const SalePage = lazy(() => import("./pages/SalePage"));
const NewPage = lazy(() => import("./pages/NewPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const BagPage = lazy(() => import("./pages/BagPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const StorePage = lazy(() => import("./pages/StorePage"));
const PoliciesPage = lazy(() => import("./pages/PoliciesPage"));
const SizeGuidePage = lazy(() => import("./pages/SizeGuidePage"));
const FabricCarePage = lazy(() => import("./pages/FabricCarePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function Deferred({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function Root() {
  useSmoothScroll();
  const location = useLocation();
  const setMenuOpen = useShop((s) => s.setMenuOpen);
  const setBagOpen = useShop((s) => s.setBagOpen);
  // Any navigation closes overlays — a drawer must never outlive the page it opened on.
  useEffect(() => {
    setMenuOpen(false);
    setBagOpen(false);
  }, [location.pathname, setMenuOpen, setBagOpen]);

  return (
    <SiteProvider>
      <ScrollRestoration />
      <Layout>
        <Outlet />
      </Layout>
    </SiteProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Deferred><HomePage /></Deferred> },
      { path: "/women", element: <Deferred><ShopPage gender="women" /></Deferred> },
      { path: "/women/:category", element: <Deferred><ShopPage gender="women" /></Deferred> },
      { path: "/men", element: <Deferred><ShopPage gender="men" /></Deferred> },
      { path: "/men/:category", element: <Deferred><ShopPage gender="men" /></Deferred> },
      { path: "/product/:id", element: <Deferred><ProductPage /></Deferred> },
      { path: "/collections", element: <Deferred><CollectionsPage /></Deferred> },
      { path: "/collections/:slug", element: <Deferred><CollectionPage /></Deferred> },
      { path: "/lookbook", element: <Deferred><LookbookPage /></Deferred> },
      { path: "/sale", element: <Deferred><SalePage /></Deferred> },
      { path: "/new", element: <Deferred><NewPage /></Deferred> },
      { path: "/search", element: <Deferred><SearchPage /></Deferred> },
      { path: "/saved", element: <Deferred><SavedPage /></Deferred> },
      { path: "/wishlist", element: <Deferred><SavedPage /></Deferred> },
      { path: "/bag", element: <Deferred><BagPage /></Deferred> },
      { path: "/about", element: <Deferred><AboutPage /></Deferred> },
      { path: "/store", element: <Deferred><StorePage /></Deferred> },
      { path: "/policies", element: <Deferred><PoliciesPage /></Deferred> },
      { path: "/size-guide", element: <Deferred><SizeGuidePage /></Deferred> },
      { path: "/fabric-care", element: <Deferred><FabricCarePage /></Deferred> },
      { path: "*", element: <Deferred><NotFoundPage /></Deferred> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
