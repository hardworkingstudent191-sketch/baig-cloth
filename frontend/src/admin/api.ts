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

// RequireAuth previously only checked whether a token existed, not whether
// it had expired — so after 24h an admin would briefly see the dashboard
// shell render before an API call 401'd and bounced them. Decoding the
// JWT's exp claim client-side (base64, no library needed) lets us catch
// this immediately instead.
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Carries the HTTP status so callers can distinguish "not found" from other
// failures, instead of matching on error message text.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  // PUT /admin/password also returns 401 for a plain wrong-current-password
  // — a normal validation error the caller needs to show inline, not a sign
  // that the session itself has expired. Without this escape hatch, typing
  // the wrong current password would force-logout and redirect to /login
  // instead of showing "current password is incorrect".
  { treatAuthErrorAsSessionExpiry = true }: { treatAuthErrorAsSessionExpiry?: boolean } = {},
): Promise<T> {
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

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Network error — check your connection and try again.");
  }

  if (res.status === 401 && treatAuthErrorAsSessionExpiry) {
    clearToken();
    window.location.href = "/admin/login";
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Request failed");
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

  // Backend caps a single page at 200 (and defaults to 100) — the admin
  // dashboard pages through with `limit`/`offset` (see PAGE_SIZE in
  // AdminDashboard.tsx) rather than assuming the whole catalog fits in one
  // request, which used to mean products past the first 100 (the OLDEST
  // ones, since the API orders newest-first) were invisible in the admin
  // panel — un-editable, un-deletable — with nothing telling you they existed.
  listProducts: (params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.offset !== undefined) query.set("offset", String(params.offset));
    const qs = query.toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id: number) => request<Product>(`/products/${id}`),

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

  // Changing the password revokes every token issued before it — including
  // the one used to make this request (the backend bumps token_version).
  // The response carries a fresh token for the new version; storing it here
  // is what keeps the admin signed in instead of being bounced to /login on
  // their very next click.
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { access_token } = await request<{ access_token: string }>(
      "/admin/password",
      {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      },
      { treatAuthErrorAsSessionExpiry: false },
    );
    setToken(access_token);
  },

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/admin/upload-image", { method: "POST", body: form });
  },
};
