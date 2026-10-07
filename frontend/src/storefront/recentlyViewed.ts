/**
 * "Recently viewed" — same localStorage-only approach as wishlist.ts, and
 * for the same reason (no accounts to attach server-side history to).
 *
 * Most-recent-first, deduped, capped at MAX so it can't grow forever.
 */
const STORAGE_KEY = "baig_recently_viewed";
const MAX = 8;

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

export function recordView(productId: number) {
  try {
    const ids = [productId, ...read().filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Best-effort — see wishlist.ts for why this fails silently.
  }
}

/** Drop ids the catalog no longer has (a definite 404), so history can't fill with dead entries. */
export function pruneRecentlyViewed(missingIds: number[]) {
  if (missingIds.length === 0) return;
  try {
    const kept = read().filter((id) => !missingIds.includes(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Best-effort — see wishlist.ts.
  }
}

/** Recently viewed ids, excluding one (typically the product currently being viewed). */
export function getRecentlyViewed(excludeId?: number): number[] {
  return read().filter((id) => id !== excludeId);
}
