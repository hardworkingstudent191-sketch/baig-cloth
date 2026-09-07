/**
 * Cloudinary delivery-URL helpers for responsive `<img>` rendering.
 *
 * `POST /admin/upload-image` already bakes f_auto,q_auto (automatic
 * format/quality) into every stored URL at upload time (see
 * backend/app/cloudinary_utils.py) — that alone gets every future upload a
 * modern format at a sane size with zero frontend involvement. What this
 * adds on top is resolution: a `srcSet` so a phone downloads a 400px image
 * instead of the same 1600px original a desktop gets.
 *
 * The 46 products live in this repo today use local static paths under
 * public/products/ (not Cloudinary). Those get the same treatment through a
 * different mechanism: scripts/optimize-images.mjs generates -400/-700/-1000
 * WebP derivatives next to each original at build time, and `localSrcSet`
 * below points at them. `imageSrcSet` / `imageUrl` are the functions
 * components should call — they pick whichever of the two applies to the
 * URL, and return undefined / the original for anything else (an external
 * URL pasted into the admin form, say), so callers never render a srcSet
 * that 404s.
 */
const CLOUDINARY_HOST = "res.cloudinary.com";

function isCloudinaryUrl(url: string): boolean {
  return url.includes(CLOUDINARY_HOST);
}

function widthTransform(url: string, width: number): string {
  // f_auto,q_auto is already in the path (baked in at upload time); adding
  // w_<n>,c_limit as a second transformation resizes down to that width
  // without ever upscaling a smaller original.
  return url.replace("/upload/", `/upload/w_${width},c_limit/`);
}

/** A single resized delivery URL — use for a plain <img src>. No-op for non-Cloudinary URLs. */
export function cloudinaryUrl(url: string, width: number): string {
  return isCloudinaryUrl(url) ? widthTransform(url, width) : url;
}

/** A `srcSet` string across the given widths — undefined for non-Cloudinary URLs, so callers can omit the attribute entirely rather than render an empty one. */
export function cloudinarySrcSet(url: string, widths: number[]): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths.map((w) => `${widthTransform(url, w)} ${w}w`).join(", ");
}


// ---- Local static product images (public/products/**) ----

const LOCAL_PREFIX = "/products/";
// Must match WIDTHS in scripts/optimize-images.mjs — the derivatives that
// actually exist on disk after `npm run images`.
export const LOCAL_WIDTHS = [400, 700, 1000] as const;

function isLocalProductImage(url: string): boolean {
  return url.startsWith(LOCAL_PREFIX) && /\.jpe?g$/i.test(url);
}

function localVariant(url: string, width: number): string {
  return url.replace(/\.jpe?g$/i, `-${width}.webp`);
}

/** srcSet over the generated WebP derivatives — undefined for anything that isn't a local product JPEG. */
export function localSrcSet(url: string): string | undefined {
  if (!isLocalProductImage(url)) return undefined;
  return LOCAL_WIDTHS.map((w) => `${localVariant(url, w)} ${w}w`).join(", ");
}

/** Smallest generated derivative at or above `width` — for fixed-size thumbnails. */
export function localUrl(url: string, width: number): string {
  if (!isLocalProductImage(url)) return url;
  const w = LOCAL_WIDTHS.find((cand) => cand >= width) ?? LOCAL_WIDTHS[LOCAL_WIDTHS.length - 1];
  return localVariant(url, w);
}

// ---- What components should actually call ----

/** Responsive srcSet for any product image URL, or undefined if none applies (omit the attribute). */
export function imageSrcSet(url: string, cloudinaryWidths: number[]): string | undefined {
  return cloudinarySrcSet(url, cloudinaryWidths) ?? localSrcSet(url);
}

/** A single resized URL for a fixed-size <img src>, falling back to the original. */
export function imageUrl(url: string, width: number): string {
  if (isCloudinaryUrl(url)) return cloudinaryUrl(url, width);
  return localUrl(url, width);
}
