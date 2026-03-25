interface DeepDiveStripProps {
  pathLabel: string;
  score: number;
  summary: string;
}

export function DeepDiveStrip({ pathLabel, score, summary }: DeepDiveStripProps) {
  const truncated = summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;
  return (
    <div className="flex flex-col gap-3 p-2">
      <p className="font-heading text-h3 truncate text-text" title={pathLabel}>
        {pathLabel}
      </p>
      <div className="flex min-h-0 items-center gap-2">
        <span className="font-mono text-kpi text-accent">{score}</span>
        <span className="text-caption text-text-dim">/ 100</span>
      </div>
      <p className="text-caption text-text-dim line-clamp-4">{truncated}</p>
    </div>
  );
}
