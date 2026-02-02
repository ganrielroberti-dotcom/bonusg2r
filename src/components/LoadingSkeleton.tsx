import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "form" | "list";
  count?: number;
}

export function LoadingSkeleton({ variant = "card", count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "table") {
    return (
      <div className="space-y-3">
        <div className="flex gap-4 p-4 bg-secondary/50 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {items.map((i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-border/50">
            {[1, 2, 3, 4, 5].map((j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i} className="p-6 rounded-xl border border-border bg-card">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
