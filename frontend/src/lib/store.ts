import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Per-device state: the WhatsApp bag, the wishlist and recently-viewed ids.
 * No accounts exist by design (ordering is a WhatsApp conversation), so
 * localStorage is the honest home for all three. Only ids are stored — the
 * products are re-fetched, so prices and stock are always current and a
 * product deleted from the catalog simply disappears (see pruneMissing).
 */

export interface BagItem {
  id: number;
  qty: number;
  addedAt: number;
}

interface ShopState {
  bag: BagItem[];
  wishlist: number[];
  recentlyViewed: number[];
  bagOpen: boolean;
  menuOpen: boolean;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  // bag
  addToBag: (id: number, qty?: number) => void;
  removeFromBag: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clearBag: () => void;
  setBagOpen: (open: boolean) => void;
  // wishlist
  toggleWishlist: (id: number) => boolean;
  isWishlisted: (id: number) => boolean;
  // recently viewed
  recordView: (id: number) => void;
  // housekeeping
  pruneMissing: (ids: number[]) => void;
  setMenuOpen: (open: boolean) => void;
}

const MAX_RECENT = 10;
const MAX_QTY = 20;

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      bag: [],
      wishlist: [],
      recentlyViewed: [],
      bagOpen: false,
      menuOpen: false,
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open, menuOpen: false }),

      addToBag: (id, qty = 1) =>
        set((s) => {
          const existing = s.bag.find((b) => b.id === id);
          if (existing) {
            return { bag: s.bag.map((b) => (b.id === id ? { ...b, qty: Math.min(MAX_QTY, b.qty + qty) } : b)), bagOpen: true };
          }
          return { bag: [...s.bag, { id, qty: Math.min(MAX_QTY, qty), addedAt: Date.now() }], bagOpen: true };
        }),
      removeFromBag: (id) => set((s) => ({ bag: s.bag.filter((b) => b.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          bag: qty <= 0 ? s.bag.filter((b) => b.id !== id) : s.bag.map((b) => (b.id === id ? { ...b, qty: Math.min(MAX_QTY, qty) } : b)),
        })),
      clearBag: () => set({ bag: [] }),
      setBagOpen: (open) => set({ bagOpen: open }),

      toggleWishlist: (id) => {
        const has = get().wishlist.includes(id);
        set((s) => ({ wishlist: has ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] }));
        return !has;
      },
      isWishlisted: (id) => get().wishlist.includes(id),

      recordView: (id) => set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((r) => r !== id)].slice(0, MAX_RECENT) })),

      pruneMissing: (ids) => {
        if (ids.length === 0) return;
        set((s) => ({
          bag: s.bag.filter((b) => !ids.includes(b.id)),
          wishlist: s.wishlist.filter((w) => !ids.includes(w)),
          recentlyViewed: s.recentlyViewed.filter((r) => !ids.includes(r)),
        }));
      },
      setMenuOpen: (open) => set({ menuOpen: open }),
    }),
    {
      name: "baig-shop-v2",
      partialize: (s) => ({ bag: s.bag, wishlist: s.wishlist, recentlyViewed: s.recentlyViewed }),
    },
  ),
);

export const selectBagCount = (s: ShopState) => s.bag.reduce((n, b) => n + b.qty, 0);
