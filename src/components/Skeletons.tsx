export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-3 space-y-2">
      <div className="h-3 w-3/4 rounded animate-shimmer" />
      <div className="h-3 w-1/2 rounded animate-shimmer" />
      <div className="h-5 w-16 rounded-full animate-shimmer" />
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-2">
      <div className="h-5 w-24 rounded animate-shimmer mb-1" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
