/**
 * Build-time feature flags derived from the environment.
 *
 * ADMIN_ENABLED — whether the React admin panel (/admin/*) is mounted.
 *
 * The React admin only works against the FastAPI backend (it calls that
 * API's /admin/login, /products CRUD and /admin/upload-image). The WordPress
 * backend is managed in wp-admin instead and exposes none of those routes, so
 * with a WordPress API URL the panel's login form could never succeed — a
 * visitor typing credentials would get a misleading "wrong password". Default:
 * off when VITE_API_URL points at a WordPress REST API (/wp-json/), on
 * otherwise. VITE_ADMIN_ENABLED=true|false overrides either way.
 */
const apiUrl = String(import.meta.env.VITE_API_URL ?? "");
const override = import.meta.env.VITE_ADMIN_ENABLED as string | undefined;

export const ADMIN_ENABLED: boolean =
  override !== undefined && override !== "" ? override !== "false" : !apiUrl.includes("/wp-json/");
