import { useRouteError, isRouteErrorResponse } from "react-router-dom";

/**
 * Last-resort screen for an unhandled render error anywhere in the app.
 *
 * React Router's built-in fallback is a developer stack trace — fine locally,
 * but it's what a customer would have seen in production. This shows
 * something readable and gives them a way back, while still logging the real
 * error to the console for debugging.
 *
 * Deliberately standalone: it does not render StorefrontLayout, because the
 * layout (or something it depends on) may be the thing that just failed. It
 * still carries #storefront-root so it inherits the site's typography and
 * paper background rather than dropping to browser defaults.
 */
export default function ErrorPage() {
  const error = useRouteError();
  console.error("Unhandled application error", error);

  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div id="storefront-root" className="min-h-screen text-[#101014] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-[0.25em] text-[#6b7280] uppercase mb-4">
          {status ?? "Error"}
        </p>
        <h1 className="font-serif text-3xl mb-3">Something went wrong.</h1>
        <p className="text-[#1f2937] text-sm mb-6">
          Sorry — this page failed to load. Reloading usually fixes it.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-[#223c80] text-[#f7f7f5] px-6 py-3 rounded text-sm hover:bg-[#2d4d9e] transition-colors"
          >
            Reload
          </button>
          {/* A hard href, not a <Link> — the router is the thing that failed. */}
          <a
            href="/"
            className="border border-[#101014] px-6 py-3 rounded text-sm hover:bg-[#101014] hover:text-[#f7f7f5] transition-colors"
          >
            Back to shop
          </a>
        </div>
      </div>
    </div>
  );
}
