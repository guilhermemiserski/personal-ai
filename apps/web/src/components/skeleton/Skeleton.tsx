interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-muted ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonBottomNav() {
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-20 flex w-[min(92vw,680px)] -translate-x-1/2 items-center justify-around rounded-2xl border border-surface-border bg-surface-card/95 p-2 backdrop-blur"
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-14 rounded-lg" />
      ))}
    </nav>
  );
}

export function AppShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-container">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-12 rounded-xl" />
          <Skeleton className="h-9 w-12 rounded-xl" />
        </div>
      </header>
      {children}
      <SkeletonBottomNav />
    </main>
  );
}
