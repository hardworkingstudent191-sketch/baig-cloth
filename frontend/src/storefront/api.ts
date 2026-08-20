import type { Category, Gender, Product } from "./types";

const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

function toQuery(params: Record<string, string | boolean | number | undefined>) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined);
  if (usable.length === 0) return "";
  return "?" + usable.map(([k, v]) => `${k}=${v}`).join("&");
}

export const storefrontApi = {
  listProducts: (filters: { gender?: Gender; category_id?: number; on_sale?: boolean; featured?: boolean } = {}) =>
    request<Product[]>(`/products${toQuery(filters)}`),

  getProduct: (id: number) => request<Product>(`/products/${id}`),

  listCategories: (gender?: Gender) =>
    request<Category[]>(`/categories${toQuery({ gender })}`),
};

// Fills in a pre-written WhatsApp message so the person only has to hit send.
export function whatsappLink(product: Product, phoneNumber: string): string {
  const message = `Hi! I'm interested in "${product.name}" (Rs ${
    product.on_sale && product.sale_price ? product.sale_price : product.price
  }). Is it available?`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
