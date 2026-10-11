import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import BottomBar from "./BottomBar";
import Footer from "./Footer";
import MenuDrawer from "./MenuDrawer";
import BagDrawer from "./BagDrawer";
import SearchOverlay from "./SearchOverlay";
import WhatsAppFab from "./WhatsAppFab";
import AnnouncementBar from "./AnnouncementBar";

/**
 * Mobile-first chrome: a slim top header, a thumb-reach bottom bar on phones
 * (hidden on product pages, which have their own action bar), and the
 * drawers/overlays. Desktop gets the full header and no bottom bar.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isProduct = pathname.startsWith("/product/");
  const transparentHeader = pathname === "/" || pathname.startsWith("/collections/") || pathname === "/lookbook" || pathname === "/about";

  return (
    <div className="min-h-dvh flex flex-col">
      <AnnouncementBar />
      <Header transparent={transparentHeader} />
      <main id="main" className={`flex-1 ${isProduct ? "" : "md:pb-0 pb-safe"}`}>
        {children}
      </main>
      <Footer />
      {!isProduct && <BottomBar />}
      <WhatsAppFab hidden={isProduct} />
      <MenuDrawer />
      <BagDrawer />
      <SearchOverlay />
    </div>
  );
}
