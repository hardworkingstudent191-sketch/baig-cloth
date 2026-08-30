/**
 * Renders public/og-image.jpg — the link preview card WhatsApp, Facebook and
 * Twitter show when someone shares the shop.
 *
 *   npm run og
 *
 * The output is committed to the repo, so this only needs re-running when the
 * card design, headline, or featured swatches change. Playwright is the only
 * reason it's a dev dependency; nothing at runtime needs it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, "..");

// Two real catalog photos, chosen for contrast (pale embroidery against dark
// sequin work) so the card reads at WhatsApp's thumbnail size.
const SWATCH_A = "public/products/womens-suits/blush-floral-embroidered.jpg";
const SWATCH_B = "public/products/womens-suits/midnight-sequin-floral.jpg";
const LOGO = "src/assets/logo-light.png";

function dataUri(relPath) {
  const abs = path.join(FRONTEND, relPath);
  const mime = path.extname(abs).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

const html = fs
  .readFileSync(path.join(HERE, "og-card.html"), "utf8")
  .replace("SWATCH_A", dataUri(SWATCH_A))
  .replace("SWATCH_B", dataUri(SWATCH_B))
  .replace("LOGO_LIGHT", dataUri(LOGO));

const browser = await chromium.launch();
// Scale factor 1 on purpose: the output has to be exactly 1200x630 to match the
// og:image:width/height declared in index.html, and every crawler prefers a
// small file to a retina one.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500); // let the webfonts actually paint

const out = path.join(FRONTEND, "public/og-image.jpg");
await page.screenshot({
  path: out,
  type: "jpeg",
  quality: 88,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await browser.close();

console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
