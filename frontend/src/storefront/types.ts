export type Gender = "men" | "women";

export interface Category {
  id: number;
  name: string;
  gender: Gender;
  sort_order: number;
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
}
