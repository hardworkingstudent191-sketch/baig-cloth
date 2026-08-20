import type { Category, Product, ProductInput } from "./types";

const API_URL = import.meta.env.VITE_API_URL as string;
const TOKEN_KEY = "baig_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/admin/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  listProducts: () => request<Product[]>("/products"),

  createProduct: (payload: ProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(payload) }),

  updateProduct: (id: number, payload: Partial<ProductInput>) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  listCategories: () => request<Category[]>("/categories"),

  createCategory: (payload: Omit<Category, "id">) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(payload) }),

  updateCategory: (id: number, payload: Partial<Omit<Category, "id">>) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/admin/upload-image", { method: "POST", body: form });
  },
};
