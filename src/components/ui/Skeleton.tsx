// Skeleton: loading placeholder for content
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
