import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

/** Shown by the router for render-time crashes (never the raw developer screen). */
export default function ErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="min-h-dvh grid place-items-center bg-ivory text-charcoal gutter">
      <div className="text-center max-w-md">
        <p className="eyebrow text-muted mb-3">{is404 ? "404" : "Something went wrong"}</p>
        <h1 className="font-display text-4xl mb-4 text-balance">{is404 ? "This page doesn't exist." : "The page hit a snag."}</h1>
        <p className="text-muted mb-8 text-pretty">{is404 ? "The link might be broken or the page may have moved." : "Reloading usually fixes it. If it keeps happening, message us on WhatsApp and we'll help."}</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/" className="inline-flex h-11 items-center rounded-pill bg-charcoal text-ivory px-6 text-sm font-medium">Back to the shop</a>
          {!is404 && (
            <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 items-center rounded-pill border border-charcoal/60 px-6 text-sm font-medium">Reload</button>
          )}
        </div>
        <p className="mt-10 text-xs text-muted"><Link to="/policies" className="underline">Help & policies</Link></p>
      </div>
    </div>
  );
}
