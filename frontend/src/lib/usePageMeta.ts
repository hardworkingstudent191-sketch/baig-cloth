import { useEffect } from "react";

const SITE_NAME = "Baig Cloth";

/**
 * Per-page document title and meta description.
 *
 * Lives at src/ rather than under storefront/ or admin/ because both route
 * trees use it — without it the admin panel inherited the storefront's title
 * and a canonical link pointing at the shop's homepage.
 *
 * This is a client-rendered SPA, so every route used to share the single
 * static <title> from index.html — every browser tab, every bookmark and
 * every browser-history entry read "Baig Cloth", with no way to tell a
 * product from the sale page. This fixes that, and gives Google (which does
 * render JavaScript) a distinct title and description per route.
 *
 * It deliberately does NOT try to fix link previews: WhatsApp and Facebook
 * read the raw HTML without running any JS, so they will always see the
 * site-wide Open Graph tags in index.html no matter what is set here.
 * Genuinely per-product previews need prerendering — see docs/todo.md.
 */
export function usePageMeta({
  title,
  description,
  noindex = false,
}: {
  /** Page-specific part of the title; the site name is appended. Pass null while data is still loading to leave the current title alone. */
  title: string | null;
  description?: string;
  /** Keep this route out of search results (thin or duplicate content). */
  noindex?: boolean;
}) {
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);

  useEffect(() => {
    if (!description) return;
    setMeta("name", "description", description);
    setMeta("property", "og:description", description);
  }, [description]);

  useEffect(() => {
    if (title === null) return;
    setMeta("property", "og:title", title ? `${title} — ${SITE_NAME}` : SITE_NAME);
  }, [title]);

  useEffect(() => {
    setCanonical(window.location.origin + window.location.pathname);
  });

  useEffect(() => {
    if (!noindex) return;
    setMeta("name", "robots", "noindex, follow");
    // Only present while this route is mounted — leaving it behind would
    // silently de-index whatever page the visitor navigated to next.
    return () => document.querySelector('meta[name="robots"]')?.remove();
  }, [noindex]);
}

function setMeta(keyAttr: "name" | "property", key: string, value: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${keyAttr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(keyAttr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}
