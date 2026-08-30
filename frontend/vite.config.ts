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
function siteMeta(siteUrl: string): Plugin {
  return {
    name: "baig-cloth-site-meta",

    transformIndexHtml() {
      return [
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
    plugins: [react(), tailwindcss(), siteMeta(siteUrl || "https://example.com")],
  };
});
