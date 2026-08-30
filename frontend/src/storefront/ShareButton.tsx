import { useState } from "react";

/**
 * Native share sheet where supported (mobile Safari/Chrome); falls back to
 * copying the URL to the clipboard with a small inline confirmation.
 * Genuinely useful here specifically: the whole business runs on people
 * forwarding a product link into a WhatsApp chat, and until now the only
 * way to do that was the browser's own address-bar copy.
 */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // AbortError when the user just closes the native sheet — not an error worth surfacing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (very old browser, insecure context) — silently no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="shrink-0 mt-1 w-9 h-9 rounded-full border border-[#dde1e8] flex items-center justify-center text-[#1f2937] hover:border-[#223c80]/40 hover:text-[#223c80] transition-colors relative"
      aria-label="Share this product"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" />
      </svg>
      {copied && (
        <span className="absolute -bottom-8 right-0 bg-[#101014] text-[#f7f7f5] text-xs px-2 py-1 rounded whitespace-nowrap">
          Link copied
        </span>
      )}
    </button>
  );
}
