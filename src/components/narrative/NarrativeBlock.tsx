interface NarrativeBlockProps {
  month: number;
  narrative: string;
  drivers: string[];
  getDriverBgClass: (driver: string) => string;
}

export function NarrativeBlock({
  month,
  narrative,
  drivers,
  getDriverBgClass,
}: NarrativeBlockProps) {
  return (
    <div
      data-testid={`narrative-block-month-${month}`}
      className="flex flex-col gap-1 rounded-lg border border-border bg-surface/60 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption font-medium text-text-dim">Month {month}</span>
        <div className="flex items-center gap-1.5" aria-label="Contributing agents">
          {drivers.map((driver, i) => (
            <span
              key={`${driver}-${i}`}
              title={driver}
              className={`inline-block h-2 w-2 rounded-full ${getDriverBgClass(driver)}`}
            />
          ))}
        </div>
      </div>
      <p className="text-body text-text">{narrative}</p>
    </div>
  );
}
