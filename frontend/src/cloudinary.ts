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
 * public/products/ (not Cloudinary) — this deliberately no-ops for those
 * rather than trying to transform a URL Cloudinary doesn't serve. It only
 * activates for images actually hosted on res.cloudinary.com, which is
 * every image uploaded through the admin panel from here on.
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
