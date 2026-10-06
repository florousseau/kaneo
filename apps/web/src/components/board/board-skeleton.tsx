const skeletonColumns = [
  { key: "col-todo", cards: 3 },
  { key: "col-progress", cards: 4 },
  { key: "col-review", cards: 2 },
  { key: "col-done", cards: 1 },
];

export default function BoardSkeleton() {
  return (
    <div className="flex h-full w-full gap-4 p-4 overflow-hidden">
      {skeletonColumns.map((col) => (
        <div key={col.key} className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-5 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: col.cards }, (_, i) => `${col.key}-${i}`).map(
              (cardKey) => (
                <div
                  key={cardKey}
                  className="rounded-lg border border-border bg-card p-3 space-y-2.5"
                >
                  <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
