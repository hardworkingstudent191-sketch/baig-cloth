import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { storefrontRoutes } from "./storefront/routes";
import { adminRoutes } from "./admin/routes";

const router = createBrowserRouter([...storefrontRoutes, ...adminRoutes]);

export default function App() {
  return <RouterProvider router={router} />;
}
