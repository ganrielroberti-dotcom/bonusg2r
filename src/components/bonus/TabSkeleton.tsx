import { Skeleton } from "@/components/ui/skeleton";

interface TabSkeletonProps {
  variant?: "form" | "list" | "config" | "report";
}

export function TabSkeleton({ variant = "form" }: TabSkeletonProps) {
  if (variant === "form") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "config") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  // report
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-2">
        <div className="flex gap-4 p-3 bg-secondary/30 rounded-lg">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-3 border-b border-border/50">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
