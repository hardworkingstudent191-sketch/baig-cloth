/**
 * Placeholder media pipeline.
 *
 * Reads media/placeholders.json — a list of free-licence images/videos
 * (Pexels / Unsplash) chosen as stand-ins until the shop's own photography
 * exists — downloads each one once into the gitignored media/raw/ cache, and
 * writes web-ready derivatives into public/media/:
 *
 *   images: <name>-1920.webp, <name>-1280.webp, <name>-768.webp, <name>-20.webp (blur-up)
 *   videos: <name>-1080.mp4, <name>-720.mp4 (H.264, muted, capped at MAX_SECONDS), <name>-poster.jpg
 *
 * and src/generated/media.ts, a typed manifest the app imports so a <picture>
 * or <video> never has to guess which files exist. Re-running is cheap:
 * downloads are cached and derivatives are skipped when newer than the source.
 *
 * Swapping a placeholder for a real photo later = drop the file into
 * media/raw/ under the same name (or edit the JSON url) and re-run.
 *
 *   node scripts/fetch-media.mjs            # everything
 *   node scripts/fetch-media.mjs --only hero-lawn   # one entry
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const LIST = path.join(ROOT, "media", "placeholders.json");
const RAW = path.join(ROOT, "media", "raw");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "src", "generated", "media.ts");

const IMAGE_WIDTHS = [1920, 1280, 768];
const MAX_SECONDS = 18; // hero loops don't need more; keeps every video under a few MB
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

// ffmpeg: FFMPEG env var, then the winget install this machine has, then PATH.
const FFMPEG =
  process.env.FFMPEG ||
  [
    "C:/Users/aneeq/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe",
  ].find((p) => existsSync(p)) ||
  "ffmpeg";

for (const dir of [RAW, OUT, path.dirname(MANIFEST)]) mkdirSync(dir, { recursive: true });

const entries = JSON.parse(readFileSync(LIST, "utf8"));
const manifest = { images: {}, videos: {} };
let downloaded = 0;
let built = 0;

function newer(a, b) {
  return existsSync(a) && existsSync(b) && statSync(a).mtimeMs >= statSync(b).mtimeMs;
}

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return false;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (placeholder fetch for baig-cloth)" }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const type = res.headers.get("content-type") || "";
  if (!/^(image|video)\//.test(type)) throw new Error(`unexpected content-type ${type} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return true;
}

async function buildImage(entry, src) {
  const meta = await sharp(src).metadata();
  const variants = {};
  for (const w of IMAGE_WIDTHS) {
    if (meta.width && meta.width < w && w !== IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]) continue; // never upscale
    const out = path.join(OUT, `${entry.name}-${w}.webp`);
    if (!newer(out, src)) {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(out);
      built++;
    }
    const m = await sharp(out).metadata();
    variants[w] = { src: `/media/${path.basename(out)}`, width: m.width, height: m.height };
  }
  const blur = path.join(OUT, `${entry.name}-20.webp`);
  if (!newer(blur, src)) {
    await sharp(src).rotate().resize({ width: 20 }).webp({ quality: 50 }).toFile(blur);
    built++;
  }
  const widths = Object.keys(variants).map(Number).sort((a, b) => b - a);
  const largest = variants[widths[0]];
  manifest.images[entry.name] = {
    src: largest.src,
    srcSet: widths.map((w) => `${variants[w].src} ${w}w`).join(", "),
    width: largest.width,
    height: largest.height,
    blur: `/media/${path.basename(blur)}`,
    alt: entry.alt || entry.subject || "",
    credit: entry.credit || entry.source || "",
  };
}

function ffprobeSeconds(src) {
  const r = spawnSync(FFMPEG.replace(/ffmpeg(\.exe)?$/, "ffprobe$1"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" });
  const n = parseFloat(r.stdout);
  return Number.isFinite(n) ? n : null;
}

function buildVideo(entry, src) {
  const outputs = {};
  const seconds = ffprobeSeconds(src);
  const trim = seconds && seconds > MAX_SECONDS ? ["-t", String(MAX_SECONDS)] : [];
  for (const [label, height, crf] of [
    ["1080", 1080, 26],
    ["720", 720, 28],
  ]) {
    const out = path.join(OUT, `${entry.name}-${label}.mp4`);
    if (!newer(out, src)) {
      const r = spawnSync(
        FFMPEG,
        [
          "-y", "-v", "error", "-i", src, ...trim, "-an",
          "-vf", `scale=-2:${height}`,
          "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", String(crf),
          "-pix_fmt", "yuv420p", "-movflags", "+faststart",
          out,
        ],
        { encoding: "utf8" },
      );
      if (r.status !== 0) throw new Error(`ffmpeg failed for ${entry.name} (${label}): ${r.stderr}`);
      built++;
    }
    outputs[label] = `/media/${path.basename(out)}`;
  }
  const poster = path.join(OUT, `${entry.name}-poster.jpg`);
  if (!newer(poster, src)) {
    const r = spawnSync(FFMPEG, ["-y", "-v", "error", "-ss", "1", "-i", src, "-frames:v", "1", "-vf", "scale=-2:1080", "-q:v", "3", poster], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`poster failed for ${entry.name}: ${r.stderr}`);
    built++;
  }
  manifest.videos[entry.name] = {
    src1080: outputs["1080"],
    src720: outputs["720"],
    poster: `/media/${path.basename(poster)}`,
    seconds: seconds ? Math.min(seconds, MAX_SECONDS) : null,
    alt: entry.alt || entry.subject || "",
    credit: entry.credit || entry.source || "",
  };
}

for (const entry of entries) {
  if (only && entry.name !== only) continue;
  const ext = entry.kind === "video" ? ".mp4" : path.extname(new URL(entry.url).pathname) || ".jpg";
  const raw = path.join(RAW, `${entry.name}${ext}`);
  try {
    if (await download(entry.url, raw)) downloaded++;
    if (entry.kind === "video") buildVideo(entry, raw);
    else await buildImage(entry, raw);
    process.stdout.write(`ok   ${entry.name}\n`);
  } catch (err) {
    process.stdout.write(`FAIL ${entry.name}: ${err.message}\n`);
  }
}

if (!only) {
  const ts =
    `// GENERATED by scripts/fetch-media.mjs — do not edit. Source list: media/placeholders.json\n` +
    `export interface MediaImage { src: string; srcSet: string; width: number; height: number; blur: string; alt: string; credit: string }\n` +
    `export interface MediaVideo { src1080: string; src720: string; poster: string; seconds: number | null; alt: string; credit: string }\n` +
    // Plain Record types on purpose: pages may reference a name before its\n` +
    `// file has been fetched (they guard with \`if (media)\`), and a literal\n` +
    `// object type would make that a compile error.\n` +
    `export const images: Record<string, MediaImage> = ${JSON.stringify(manifest.images, null, 2)};\n` +
    `export const videos: Record<string, MediaVideo> = ${JSON.stringify(manifest.videos, null, 2)};\n`;
  writeFileSync(MANIFEST, ts);
}
console.log(`\n${downloaded} downloaded, ${built} derivatives built, ${Object.keys(manifest.images).length} images + ${Object.keys(manifest.videos).length} videos in manifest`);
