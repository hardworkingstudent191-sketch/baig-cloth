export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-bone rounded-card ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-3.5 w-3/4 mt-3" />
          <Skeleton className="h-3.5 w-1/3 mt-2" />
        </div>
      ))}
    </div>
  );
}
