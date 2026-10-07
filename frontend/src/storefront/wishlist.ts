/**
 * Wishlist, stored client-side only.
 *
 * There's no customer account system in this app by design (see
 * CLAUDE.md — WhatsApp ordering, no login), so a "saved items" feature has
 * nowhere server-side to live. localStorage is the honest fit: it's
 * per-device, doesn't need a backend change, and is exactly the kind of
 * per-viewer convenience the storefront already leans on elsewhere.
 *
 * Cross-tab/cross-component sync: components using useWishlist() re-render
 * on both the standard `storage` event (fires in OTHER tabs when
 * localStorage changes) and a same-window CustomEvent this module dispatches
 * itself (the `storage` event deliberately does NOT fire in the tab that
 * made the change, which is why the header's saved-count badge wouldn't
 * otherwise update the instant you tap a heart).
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "baig_wishlist";
const EVENT_NAME = "baig-wishlist-change";

function read(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // localStorage can throw (private browsing, storage full, disabled) —
    // the wishlist just silently doesn't persist rather than crashing the page.
  }
}

export function isWishlisted(productId: number): boolean {
  return read().includes(productId);
}

export function toggleWishlist(productId: number): boolean {
  const ids = read();
  const idx = ids.indexOf(productId);
  if (idx === -1) {
    write([...ids, productId]);
    return true;
  }
  write(ids.filter((id) => id !== productId));
  return false;
}

/**
 * Remove ids the catalog no longer has (the API answered a definite 404). The
 * header badge counts raw stored ids while the /wishlist page silently drops
 * missing products, so without pruning a deleted product leaves a ghost count
 * ("3" in the header, "Nothing saved yet" on the page) that never clears.
 */
export function pruneWishlist(missingIds: number[]) {
  if (missingIds.length === 0) return;
  const ids = read();
  const kept = ids.filter((id) => !missingIds.includes(id));
  if (kept.length !== ids.length) write(kept);
}

/** Reactive wishlist state for one product — re-renders when it changes anywhere. */
export function useWishlisted(productId: number): [boolean, () => void] {
  const [saved, setSaved] = useState(() => isWishlisted(productId));

  useEffect(() => {
    const sync = () => setSaved(isWishlisted(productId));
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  return [saved, () => toggleWishlist(productId)];
}

/** Reactive full list of saved product ids — used by the header badge and /wishlist page. */
export function useWishlistIds(): number[] {
  const [ids, setIds] = useState<number[]>(() => read());

  useEffect(() => {
    const sync = () => setIds(read());
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return ids;
}
