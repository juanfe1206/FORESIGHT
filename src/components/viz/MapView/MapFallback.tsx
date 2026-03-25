export function MapFallback() {
  return (
    <div
      role="status"
      data-testid="map-fallback"
      className="flex min-h-[10rem] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 p-4 text-center"
    >
      <p className="max-w-xs text-caption text-text-dim">
        Map visualization unavailable — geographic context continues below.
      </p>
    </div>
  );
}
