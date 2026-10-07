"""Package the WordPress deployment: plugin zip + production frontend build.

    py -3.12 wordpress/scripts/package_release.py \
        --api-url  https://cms.yourdomain.com/wp-json/baig/v1 \
        --site-url https://yourdomain.com

Produces, under wordpress/dist/:
    baig-cloth-headless.zip   upload via WordPress -> Plugins -> Add New -> Upload
    storefront/               the built frontend; upload its CONTENTS to the
                              storefront domain's public_html
    catalog-export.json       copy of the catalog for Products -> Import catalog
    RELEASE.txt               what was built, from which commit, with checksums

The frontend build is passed VITE_API_URL / VITE_SITE_URL explicitly, so it
cannot pick up a leftover dev override in frontend/.env.local (the build also
refuses localhost / plain-http API URLs on its own). Use --skip-frontend to
package only the plugin.
"""

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
PLUGIN_DIR = ROOT / "wordpress" / "plugins" / "baig-cloth-headless"
FRONTEND_DIR = ROOT / "frontend"
CATALOG = ROOT / "wordpress" / "migration" / "catalog-export.json"
DIST = ROOT / "wordpress" / "dist"

SKIP_NAMES = {".DS_Store", "Thumbs.db"}
SKIP_DIRS = {"__pycache__", ".git", "node_modules"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def git(*args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()
    except Exception:
        return "unknown"


def zip_plugin(out: Path) -> int:
    """Zip with the plugin folder as the single top-level entry (what
    WordPress expects) and forward-slash names (Windows zip tools sometimes
    write backslashes, which WordPress rejects)."""
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(PLUGIN_DIR.rglob("*")):
            if path.is_dir() or path.name in SKIP_NAMES:
                continue
            if any(part in SKIP_DIRS for part in path.relative_to(PLUGIN_DIR).parts):
                continue
            arcname = f"{PLUGIN_DIR.name}/{path.relative_to(PLUGIN_DIR).as_posix()}"
            zf.write(path, arcname)
            count += 1
    return count


def check_https_url(label: str, value: str) -> None:
    u = urlparse(value)
    if u.scheme != "https" or not u.netloc:
        sys.exit(f"--{label} must be a full https URL (got {value!r}).")


def build_frontend(api_url: str, site_url: str, out: Path) -> None:
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        sys.exit("npm was not found on PATH — install Node.js or use --skip-frontend.")
    env = {**os.environ, "VITE_API_URL": api_url, "VITE_SITE_URL": site_url}
    # Explicit env wins over .env / .env.local, so a dev override cannot leak in.
    print("Building the storefront (npm run build)...")
    subprocess.run([npm, "run", "build"], cwd=FRONTEND_DIR, env=env, check=True)
    built = FRONTEND_DIR / "dist"
    if not (built / "index.html").exists():
        sys.exit("Build finished but frontend/dist/index.html is missing.")
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(built, out)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--api-url", help="https URL of the WordPress REST base, e.g. https://cms.example.com/wp-json/baig/v1")
    ap.add_argument("--site-url", help="https origin the storefront will be served from, e.g. https://example.com")
    ap.add_argument("--skip-frontend", action="store_true", help="package only the plugin zip")
    args = ap.parse_args()

    if not args.skip_frontend:
        if not (args.api_url and args.site_url):
            sys.exit("--api-url and --site-url are required (or pass --skip-frontend).")
        check_https_url("api-url", args.api_url)
        check_https_url("site-url", args.site_url)

    DIST.mkdir(parents=True, exist_ok=True)

    zip_path = DIST / "baig-cloth-headless.zip"
    n = zip_plugin(zip_path)
    print(f"Plugin zip: {zip_path.relative_to(ROOT)} ({n} files)")

    if CATALOG.exists():
        shutil.copyfile(CATALOG, DIST / "catalog-export.json")

    frontend_note = "skipped (--skip-frontend)"
    if not args.skip_frontend:
        build_frontend(args.api_url, args.site_url, DIST / "storefront")
        frontend_note = f"wordpress/dist/storefront/  (API {args.api_url}, site {args.site_url})"

    dirty = git("status", "--porcelain")
    lines = [
        "Baig Cloth WordPress release",
        f"commit:   {git('rev-parse', '--short', 'HEAD')}  branch {git('rev-parse', '--abbrev-ref', 'HEAD')}"
        + ("   [WORKING TREE HAS UNCOMMITTED CHANGES]" if dirty and dirty != "unknown" else ""),
        f"plugin:   baig-cloth-headless.zip  sha256 {sha256(zip_path)}",
        f"frontend: {frontend_note}",
        "",
        "Deploy: see wordpress/README.md ('Deploying to Hostinger').",
    ]
    (DIST / "RELEASE.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
