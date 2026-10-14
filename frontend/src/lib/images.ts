import type { ProductImage } from "./types";

/**
 * Responsive image sources for the three kinds of product image URL the
 * catalog can hold:
 *  - repo-relative /products/x.jpg — shipped with the storefront; the build
 *    generates -400/-700/-1000 WebP derivatives (scripts/optimize-images.mjs);
 *  - WordPress Media Library uploads — the API sends WordPress's own srcset;
 *  - Cloudinary URLs (legacy) — width transforms in the URL;
 *  - anything else — passed through untouched (no srcset, never a 404 variant).
 */

const LOCAL_PREFIX = "/products/";
export const LOCAL_WIDTHS = [400, 700, 1000] as const;

function isLocalProductImage(url: string): boolean {
  return url.startsWith(LOCAL_PREFIX) && /\.jpe?g$/i.test(url);
}
function localVariant(url: string, width: number): string {
  return url.replace(/\.jpe?g$/i, `-${width}.webp`);
}
function isCloudinary(url: string): boolean {
  return url.includes("res.cloudinary.com");
}
function cloudinaryWidth(url: string, width: number): string {
  return url.replace("/upload/", `/upload/w_${width},c_limit/`);
}

export interface ImageSource {
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
  alt: string;
}

/** Build <img> attributes for a product image. `width` picks the single-src fallback size. */
export function imageSource(image: ProductImage | string, width = 700, alt = ""): ImageSource {
  const img: ProductImage = typeof image === "string" ? { url: image } : image;
  const url = img.url;
  if (isLocalProductImage(url)) {
    const w = LOCAL_WIDTHS.find((c) => c >= width) ?? LOCAL_WIDTHS[LOCAL_WIDTHS.length - 1];
    return {
      src: localVariant(url, w),
      srcSet: LOCAL_WIDTHS.map((lw) => `${localVariant(url, lw)} ${lw}w`).join(", "),
      width: 1000,
      height: 1250,
      alt: img.alt ?? alt,
    };
  }
  if (img.srcset) {
    return { src: url, srcSet: img.srcset, width: img.width, height: img.height, alt: img.alt ?? alt };
  }
  if (isCloudinary(url)) {
    return {
      src: cloudinaryWidth(url, width),
      srcSet: [400, 700, 1000, 1600].map((w) => `${cloudinaryWidth(url, w)} ${w}w`).join(", "),
      alt: img.alt ?? alt,
    };
  }
  return { src: url, width: img.width, height: img.height, alt: img.alt ?? alt };
}

/** First image of a product as attributes, or null. */
export function primaryImage(images: ProductImage[], fallbackUrls: string[], width = 700, alt = ""): ImageSource | null {
  const first = images[0] ?? (fallbackUrls[0] ? { url: fallbackUrls[0] } : null);
  return first ? imageSource(first, width, alt) : null;
}

/**
 * Phones get the lighter 720p sibling of a "-1080.mp4" placeholder/clip
 * (scripts/fetch-media.mjs always writes both). Any other URL — a video
 * uploaded to the WordPress media library, say — is returned untouched.
 */
export function responsiveVideo(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const phone = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return phone ? url.replace(/-1080\.mp4(\?.*)?$/, "-720.mp4$1") : url;
}
