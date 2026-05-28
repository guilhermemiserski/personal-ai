import { AppShellSkeleton, Skeleton } from "@/components/skeleton/Skeleton";

export function HomeRedirectSkeleton() {
  return (
    <main className="app-container flex min-h-screen flex-col items-center justify-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56" />
    </main>
  );
}

export function AuthPageSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="mx-auto mt-6 h-4 w-40" />
      </div>
    </main>
  );
}

export function DashboardSkeleton() {
  return (
    <AppShellSkeleton>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      <div className="mt-5 space-y-2">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </AppShellSkeleton>
  );
}

export function WorkoutSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="mt-2 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-surface-border bg-surface-card p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4 max-w-[200px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
    </AppShellSkeleton>
  );
}

export function ProgressSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
      <Skeleton className="mt-5 h-40 w-full rounded-2xl" />
      <Skeleton className="mt-5 h-40 w-full rounded-2xl" />
    </AppShellSkeleton>
  );
}

export function ProfileSkeleton() {
  return (
    <AppShellSkeleton>
      <Skeleton className="mt-1 h-52 w-full rounded-2xl" />
      <Skeleton className="mt-5 h-36 w-full rounded-2xl" />
      <Skeleton className="mt-5 h-32 w-full rounded-2xl" />
    </AppShellSkeleton>
  );
}

export function CoachSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="mt-1 space-y-3 rounded-2xl border border-surface-border bg-surface-card p-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="ml-10 h-14 w-[85%] rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="ml-10 h-12 w-[70%] rounded-xl" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-20 rounded-xl" />
      </div>
    </AppShellSkeleton>
  );
}

export function OnboardingSkeleton() {
  return (
    <main className="app-container">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="mt-8 h-11 w-full rounded-xl" />
    </main>
  );
}

export function OnboardingGeneratingSkeleton() {
  return (
    <main className="app-container flex flex-col items-center py-12">
      <Skeleton className="h-14 w-14 rounded-full" />
      <Skeleton className="mt-6 h-6 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-sm" />
      <Skeleton className="mt-2 h-4 w-[80%] max-w-xs" />
      <div className="mt-10 w-full max-w-md space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
