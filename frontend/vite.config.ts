import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Public routes worth handing to a search engine. Product URLs are left out
// deliberately: they're database-driven, so listing them would mean hitting a
// live API during the build and shipping a sitemap that goes stale the moment
// a product is deleted. Crawlers reach products by following the category
// pages, which is enough for a catalog this size.
const STATIC_ROUTES = ["/", "/men", "/women", "/sale", "/policies", "/about"];

const SITE_TITLE = "Baig Cloth — Unstitched Fabric for Men & Women";
const SITE_DESCRIPTION =
  "Hand-picked lawn, cotton, wash-and-wear and embroidered unstitched fabric. Order directly over WhatsApp.";

/**
 * Content-Security-Policy, delivered as a <meta> tag since this is a static
 * host with no server-side control over response headers (see
 * public/.htaccess for the headers that CAN be set that way).
 *
 * `apiOrigin` has to be a real parameter rather than hardcoded: VITE_API_URL
 * is `http://localhost:8000` in dev and a different host entirely in
 * production, and every `fetch()` in storefront/api.ts and admin/api.ts
 * targets it — connect-src would silently block every API call otherwise.
 *
 * style-src needs 'unsafe-inline': several components (HomePage's staggered
 * hero-rise delays, the --hero-delay custom property) set inline `style=`
 * attributes for per-element animation timing, which can't be expressed as
 * a static hash/nonce. script-src stays strict with no such escape hatch.
 *
 * Note: frame-ancestors is NOT included here — per spec, browsers ignore it
 * when set via <meta> (it only takes effect as a real HTTP header). Clickjacking
 * protection for the frontend instead comes from X-Frame-Options in .htaccess.
 */
function buildCsp(apiOrigin: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    // apiOrigin: with the WordPress backend, photos uploaded through its Media
    // Library are served from the WordPress host (/wp-content/uploads/...),
    // the same origin as the API — without it the browser silently blocks them.
    `img-src 'self' data: https://res.cloudinary.com ${apiOrigin}`,
    `media-src 'self'`,
    `connect-src 'self' ${apiOrigin}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

/**
 * One source of truth for the public origin.
 *
 * `VITE_SITE_URL` feeds three things that all have to agree — the absolute
 * URLs in the Open Graph tags (WhatsApp/Facebook link previews only accept
 * absolute ones), the `Sitemap:` line in robots.txt, and every `<loc>` in
 * sitemap.xml. Keeping them derived from one variable is why robots.txt and
 * sitemap.xml are generated here rather than checked into public/.
 *
 * The meta tags are injected as parsed tags rather than substituted into
 * index.html: Vite runs decodeURI over href/content attributes while parsing
 * the HTML, so a %PLACEHOLDER% there fails the build outright.
 */
function siteMeta(siteUrl: string, apiOrigin: string, isProd: boolean): Plugin {
  return {
    name: "baig-cloth-site-meta",

    transformIndexHtml() {
      return [
        // CSP only in the production build: Vite dev mode injects its own
        // inline React-Refresh preamble script before loading main.tsx, which
        // a strict script-src 'self' blocks outright (breaks the page
        // entirely — "can't detect preamble"). Dev's HMR websocket and inline
        // tooling script are Vite's own trusted local-only surface, not the
        // thing this policy is meant to guard against; the real, shipped
        // bundle has no inline scripts at all, so the built site gets the
        // full policy with nothing to work around.
        ...(isProd
          ? [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: buildCsp(apiOrigin) }, injectTo: "head-prepend" as const }]
          : []),
        { tag: "link", attrs: { rel: "manifest", href: "/manifest.webmanifest" }, injectTo: "head" as const },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "/icon-192.png" }, injectTo: "head" as const },
        { tag: "link", attrs: { rel: "canonical", href: `${siteUrl}/` }, injectTo: "head" as const },

        ...(
          [
            ["og:type", "website"],
            ["og:site_name", "Baig Cloth"],
            ["og:title", SITE_TITLE],
            ["og:description", SITE_DESCRIPTION],
            ["og:url", `${siteUrl}/`],
            ["og:image", `${siteUrl}/og-image.jpg`],
            ["og:image:width", "1200"],
            ["og:image:height", "630"],
            ["og:image:alt", "Baig Cloth — unstitched fabric, made simple."],
            ["og:locale", "en_PK"],
          ] as const
        ).map(([property, content]) => ({
          tag: "meta",
          attrs: { property, content },
          injectTo: "head" as const,
        })),

        ...(
          [
            ["twitter:card", "summary_large_image"],
            ["twitter:title", SITE_TITLE],
            ["twitter:description", SITE_DESCRIPTION],
            ["twitter:image", `${siteUrl}/og-image.jpg`],
          ] as const
        ).map(([name, content]) => ({
          tag: "meta",
          attrs: { name, content },
          injectTo: "head" as const,
        })),
      ];
    },

    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);

      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: [
          "User-agent: *",
          "Allow: /",
          "",
          "# The admin panel is client-side only and sits behind a JWT login,",
          "# but there's no reason for it to appear in search results either.",
          "Disallow: /admin",
          "",
          `Sitemap: ${siteUrl}/sitemap.xml`,
          "",
        ].join("\n"),
      });

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          STATIC_ROUTES.map(
            (route) =>
              `  <url>\n` +
              `    <loc>${siteUrl}${route}</loc>\n` +
              `    <lastmod>${today}</lastmod>\n` +
              `    <changefreq>${route === "/" || route === "/sale" ? "weekly" : "monthly"}</changefreq>\n` +
              `    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n` +
              `  </url>`,
          ).join("\n") +
          `\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const siteUrl = (env.VITE_SITE_URL ?? "").replace(/\/$/, "");
  // CSP source expressions do path matching, and a path without a trailing
  // slash must match EXACTLY — so putting a full API URL with a path (the
  // WordPress backend lives at /wp-json/baig/v1) into connect-src would block
  // every API call the built site makes. connect-src wants the ORIGIN only.
  const rawApiUrl = env.VITE_API_URL ?? "http://localhost:8000";
  let apiOrigin: string;
  try {
    apiOrigin = new URL(rawApiUrl).origin;
  } catch {
    apiOrigin = rawApiUrl.replace(/\/$/, "");
  }

  if (!siteUrl && mode === "production") {
    // Not fatal — a preview build with placeholder URLs is still useful — but
    // shipping this to the real domain would give every shared link a broken
    // preview image, so it needs to be loud.
    console.warn(
      "\n[baig-cloth] VITE_SITE_URL is not set. Open Graph tags, robots.txt and\n" +
        "sitemap.xml will point at the placeholder domain. Set it in frontend/.env\n" +
        "(or the host's build env) before deploying to production.\n",
    );
  }

  return {
    plugins: [react(), tailwindcss(), siteMeta(siteUrl || "https://example.com", apiOrigin, mode === "production")],
  };
});
