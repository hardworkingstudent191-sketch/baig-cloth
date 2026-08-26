// Shared loading skeleton — replaces plain "Loading…" text across every
// storefront page that fetches products. Matches ProductCard's exact
// dimensions so the layout doesn't jump once real content arrives.
export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-[#eef0f3] rounded border border-[#dde1e8]" />
          <div className="mt-2.5 h-3.5 w-3/4 bg-[#eef0f3] rounded" />
          <div className="mt-1.5 h-3 w-1/3 bg-[#eef0f3] rounded" />
        </div>
      ))}
    </div>
  );
}
