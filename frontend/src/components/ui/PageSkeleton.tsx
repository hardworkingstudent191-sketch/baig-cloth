import { Skeleton, ProductGridSkeleton } from "./Skeleton";

/** Route-chunk loading state: enough shape that the page doesn't jump when it arrives. */
export default function PageSkeleton() {
  return (
    <div className="gutter pt-8 md:pt-12" aria-busy="true" aria-live="polite">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-2/3 md:w-1/3 mt-3 mb-8" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
