import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import path from "node:path";

const SITE_TITLE = "Baig Cloth — Unstitched Fabric for Men & Women";
const SITE_DESCRIPTION =
  "Hand-picked lawn, cotton, wash & wear and embroidered unstitched fabric for men and women in Faisalabad. Browse the collection and order over WhatsApp.";

/** Public routes listed in sitemap.xml; dynamic ones (/product/:id, /collections/:slug) come from the API and are found by crawling. */
const STATIC_ROUTES = ["/", "/women", "/men", "/sale", "/new", "/collections", "/lookbook", "/about", "/store", "/policies", "/size-guide", "/fabric-care"];

/**
 * Content-Security-Policy as a <meta> tag (static host: no server-side
 * headers). connect-src/img-src/media-src need the API ORIGIN only — a path
 * in a CSP source must match exactly, so a full /wp-json/baig/v1 URL would
 * block every call. Media Library uploads and videos are served from the
 * WordPress host, hence img-src/media-src.
 */
function buildCsp(apiOrigin: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://res.cloudinary.com https://images.pexels.com https://images.unsplash.com ${apiOrigin}`,
    `media-src 'self' blob: ${apiOrigin}`,
    `connect-src 'self' ${apiOrigin}`,
    `frame-src https://www.google.com https://maps.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

/**
 * Link-preview crawlers (WhatsApp, Facebook, Twitter, Telegram…) never run
 * JavaScript, so /product/{id} would show the site-wide card for every
 * product. The WordPress plugin serves a per-product card at
 * {wpRoot}/share/product/{id}; this .htaccess rule sends ONLY those crawlers
 * there (humans and Google keep the SPA). Written at build time because the
 * CMS root comes from VITE_API_URL.
 */
function buildHtaccess(template: string, wpRoot: string | null): string {
  const rule = wpRoot
    ? [
        "  # Per-product link previews: crawlers that build share cards are sent to",
        "  # the CMS share endpoint for that product (see wordpress/.../share.php).",
        "  RewriteCond %{HTTP_USER_AGENT} (facebookexternalhit|facebookcatalog|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Snapchat|redditbot|SkypeUriPreview|Viber) [NC]",
        `  RewriteRule ^product/([0-9]+)/?$ ${wpRoot}/share/product/$1 [R=302,L]`,
        "",
      ].join("\n")
    : "";
  return template.replace("  # {{SHARE_REDIRECT}}\n", rule);
}

function siteMeta(siteUrl: string, apiOrigin: string, wpRoot: string | null, isProd: boolean): Plugin {
  return {
    name: "baig-cloth-site-meta",

    transformIndexHtml() {
      return [
        ...(isProd ? [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: buildCsp(apiOrigin) }, injectTo: "head-prepend" as const }] : []),
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
            ["og:image:alt", "Baig Cloth — unstitched fabric, chosen by hand."],
            ["og:locale", "en_PK"],
          ] as const
        ).map(([property, content]) => ({ tag: "meta", attrs: { property, content }, injectTo: "head" as const })),
        ...(
          [
            ["twitter:card", "summary_large_image"],
            ["twitter:title", SITE_TITLE],
            ["twitter:description", SITE_DESCRIPTION],
            ["twitter:image", `${siteUrl}/og-image.jpg`],
          ] as const
        ).map(([name, content]) => ({ tag: "meta", attrs: { name, content }, injectTo: "head" as const })),
      ];
    },

    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: ["User-agent: *", "Allow: /", "", `Sitemap: ${siteUrl}/sitemap.xml`, ""].join("\n"),
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          STATIC_ROUTES.map(
            (route) =>
              `  <url>\n    <loc>${siteUrl}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route === "/" || route === "/sale" || route === "/new" ? "weekly" : "monthly"}</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`,
          ).join("\n") +
          `\n</urlset>\n`,
      });
      const template = readFileSync(path.resolve(__dirname, "scripts/htaccess.template"), "utf8");
      this.emitFile({ type: "asset", fileName: ".htaccess", source: buildHtaccess(template, wpRoot) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const siteUrl = (env.VITE_SITE_URL ?? "").replace(/\/$/, "");
  const rawApiUrl = env.VITE_API_URL ?? "http://localhost:8000";

  let apiOrigin: string;
  try {
    apiOrigin = new URL(rawApiUrl).origin;
  } catch {
    apiOrigin = rawApiUrl.replace(/\/$/, "");
  }
  // The WordPress root (for the share endpoint): the API URL minus /wp-json/…
  const wpRoot = rawApiUrl.includes("/wp-json/") ? rawApiUrl.replace(/\/wp-json\/.*$/, "") : null;

  // A production bundle pointing at localhost/http ships fine and then fails
  // for every visitor. Vite reads .env.local in production mode too, so a
  // leftover dev override would be baked in silently. Fail the build instead;
  // VITE_ALLOW_LOCAL_API=1 is the explicit escape hatch for `vite preview`.
  if (mode === "production" && env.VITE_ALLOW_LOCAL_API !== "1") {
    let local = false;
    try {
      const u = new URL(rawApiUrl);
      local = u.protocol !== "https:" || /^(localhost|127\.|\[::1\])/i.test(u.hostname);
    } catch {
      local = true;
    }
    if (local) {
      throw new Error(
        `\n[baig-cloth] Refusing to build for production with VITE_API_URL="${rawApiUrl}".\n` +
          `It must be the real https API URL (e.g. https://cms.yourdomain.com/wp-json/baig/v1).\n` +
          `Check frontend/.env AND frontend/.env.local (Vite reads both in production mode).\n` +
          `For a local \`vite preview\` smoke test, set VITE_ALLOW_LOCAL_API=1.\n`,
      );
    }
  }

  if (!siteUrl && mode === "production") {
    console.warn(
      "\n[baig-cloth] VITE_SITE_URL is not set. Open Graph tags, robots.txt and\n" +
        "sitemap.xml will point at the placeholder domain. Set it in frontend/.env\n" +
        "(or the host's build env) before deploying to production.\n",
    );
  }

  return {
    plugins: [react(), tailwindcss(), siteMeta(siteUrl || "https://example.com", apiOrigin, wpRoot, mode === "production")],
    build: {
      target: "es2022",
      cssMinify: "lightningcss",
      rollupOptions: {
        output: {
          manualChunks: {
            motion: ["motion", "gsap", "gsap/ScrollTrigger", "lenis"],
            carousel: ["embla-carousel-react", "embla-carousel-autoplay"],
          },
        },
      },
    },
  };
});
