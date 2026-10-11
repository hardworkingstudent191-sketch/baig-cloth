import type { Category, Collection, Facets, Gender, HomeData, InstagramPost, Product, ProductFilters, SiteSettings, Slide, Testimonial } from "./types";

// Trailing slashes stripped: paths below start with "/", so a base of
// ".../wp-json/baig/v1/" would otherwise request ".../v1//products" (404).
const API_URL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Carries the HTTP status so "not found" can be told apart from a network failure. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ListResult<T> {
  items: T[];
  /** Total matches before limit/offset (from X-Total-Count), or null if the server didn't say. */
  total: number | null;
}

/** 12 s is generous for a shared host yet short enough that a hung request shows an error, not a forever-spinner. */
const TIMEOUT_MS = 12_000;

async function request<T>(path: string, signal?: AbortSignal): Promise<{ data: T; headers: Headers }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { signal: controller.signal, headers: { Accept: "application/json" } });
  } catch (err) {
    if (signal?.aborted) throw err; // caller cancelled — not an error to show
    throw new ApiError(0, "Couldn't reach the shop. Check your connection and try again.");
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${path}`);
  return { data: (await res.json()) as T, headers: res.headers };
}

function toQuery(params: Record<string, string | number | boolean | number[] | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    parts.push(`${k}=${encodeURIComponent(Array.isArray(v) ? v.join(",") : String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export const api = {
  async products(filters: ProductFilters = {}, signal?: AbortSignal): Promise<ListResult<Product>> {
    const { data, headers } = await request<Product[]>(`/products${toQuery({ ...filters })}`, signal);
    const total = headers.get("X-Total-Count");
    return { items: data, total: total === null ? null : Number(total) };
  },
  async product(id: number, signal?: AbortSignal): Promise<Product> {
    return (await request<Product>(`/products/${id}`, signal)).data;
  },
  /** Several products by id in one request, in the given order; missing ids are simply absent. */
  async productsByIds(ids: number[], signal?: AbortSignal): Promise<Product[]> {
    if (ids.length === 0) return [];
    return (await request<Product[]>(`/products${toQuery({ ids, limit: Math.min(200, Math.max(1, ids.length)) })}`, signal)).data;
  },
  async categories(gender?: Gender, signal?: AbortSignal): Promise<Category[]> {
    return (await request<Category[]>(`/categories${toQuery({ gender })}`, signal)).data;
  },
  async facets(params: { gender?: Gender; category_id?: number } = {}, signal?: AbortSignal): Promise<Facets> {
    return (await request<Facets>(`/facets${toQuery(params)}`, signal)).data;
  },
  async home(signal?: AbortSignal): Promise<HomeData> {
    return (await request<HomeData>("/home", signal)).data;
  },
  async site(signal?: AbortSignal): Promise<SiteSettings> {
    return (await request<SiteSettings>("/site", signal)).data;
  },
  async slides(signal?: AbortSignal): Promise<Slide[]> {
    return (await request<Slide[]>("/slides", signal)).data;
  },
  async collections(signal?: AbortSignal): Promise<Collection[]> {
    return (await request<Collection[]>("/collections", signal)).data;
  },
  async collection(slug: string, signal?: AbortSignal): Promise<Collection & { products: Product[] }> {
    return (await request<Collection & { products: Product[] }>(`/collections/${encodeURIComponent(slug)}`, signal)).data;
  },
  async testimonials(featured?: boolean, signal?: AbortSignal): Promise<Testimonial[]> {
    return (await request<Testimonial[]>(`/testimonials${toQuery({ featured })}`, signal)).data;
  },
  async instagram(signal?: AbortSignal): Promise<InstagramPost[]> {
    return (await request<InstagramPost[]>("/instagram", signal)).data;
  },
};
