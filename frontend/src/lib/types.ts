/**
 * Shapes served by the WordPress plugin at /wp-json/baig/v1 (see
 * wordpress/plugins/baig-cloth-headless/includes/rest-api.php and rest-v2.php).
 * Prices are strings with two decimals ("3000.00") — the original contract.
 */

export type Gender = "men" | "women";

export interface Category {
  id: number;
  name: string;
  gender: Gender;
  sort_order: number;
}

export interface ProductImage {
  url: string;
  srcset?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  color: string;
  color_hex: string;
  image: string | null;
  in_stock: boolean;
}

export interface PieceDetail {
  name: string;
  meters: string;
}

export interface DetailRow {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  description: string;
  price: string;
  sale_price: string | null;
  on_sale: boolean;
  sale_ends_at: string | null;
  in_stock: boolean;
  image_urls: string[];
  featured: boolean;
  created_at: string;
  // v2
  sku: string;
  fabric: string;
  pieces: number | null;
  piece_details: PieceDetail[];
  color: string;
  color_hex: string;
  design_group: string;
  variants: ProductVariant[];
  care: string;
  details: DetailRow[];
  is_new: boolean;
  collections: string[];
  images: ProductImage[];
}

export interface Collection {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  cover: string;
  video: string;
  gender: Gender | "all";
  sort_order: number;
  featured: boolean;
  count: number;
  products?: Product[];
}

export interface Slide {
  id: number;
  headline: string;
  subheadline: string;
  eyebrow: string;
  media_type: "image" | "video";
  image: string;
  image_mobile: string;
  video: string;
  cta_label: string;
  cta_url: string;
  tone: "light" | "dark";
}

export interface Testimonial {
  id: number;
  name: string;
  quote: string;
  city: string;
  rating: number;
  source: string;
  photo: string;
  featured: boolean;
}

export interface InstagramPost {
  id: number;
  caption: string;
  image: string;
  link: string;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  about_story: string;
  established: string;
  whatsapp: string;
  phone_display: string;
  email: string;
  address: string[];
  city: string;
  hours: { days: string; hours: string }[];
  map: { url: string; lat: number | null; lng: number | null };
  social: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube", string>>;
  announcement: { text: string; url: string } | null;
  delivery_note: string;
}

export interface Facets {
  fabrics: { value: string; count: number }[];
  colors: { name: string; hex: string; count: number }[];
  collections: { slug: string; name: string; count: number }[];
  price: { min: number; max: number };
}

export interface HomeData {
  site: SiteSettings;
  slides: Slide[];
  collections: Collection[];
  featured: Product[];
  new_arrivals: Product[];
  sale: { count: number; preview: Product[] };
  counts: { women: number; men: number };
  testimonials: Testimonial[];
  instagram: InstagramPost[];
}

export type SortOption = "newest" | "price_asc" | "price_desc" | "name";

export interface ProductFilters {
  gender?: Gender;
  category_id?: number;
  on_sale?: boolean;
  featured?: boolean;
  is_new?: boolean;
  search?: string;
  fabric?: string;
  color?: string;
  collection?: string;
  min_price?: number;
  max_price?: number;
  sort?: SortOption;
  ids?: number[];
  limit?: number;
  offset?: number;
}
