import type { Category, Gender, Product } from "./types";

// Trailing slashes stripped: paths below start with "/", so a base of
// ".../wp-json/baig/v1/" would request ".../v1//products", which WordPress's
// route matching rejects (404 for the entire catalog).
const API_URL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// Carries the HTTP status so callers can tell "not found" apart from a
// genuine network/server failure, instead of both looking like the same
// generic Error.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new ApiError(0, "Network error — check your connection and try again.");
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${path}`);
  return res.json();
}

function toQuery(params: Record<string, string | boolean | number | undefined>) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined);
  if (usable.length === 0) return "";
  return "?" + usable.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const storefrontApi = {
  listProducts: (
    filters: {
      gender?: Gender;
      category_id?: number;
      on_sale?: boolean;
      featured?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) => request<Product[]>(`/products${toQuery(filters)}`),

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
