type PanelHeaderProps = {
  title: string;
  subtitle?: string;
  /** Tailwind classes for path accent (e.g. Path A vs Path B). */
  accentClassName?: string;
  /** Semantic heading level; default h2 for panel titles. */
  headingLevel?: "h2" | "h3";
};

const headingClass = "font-heading text-h3 line-clamp-2 break-words";

/**
 * Path panel title region — user-derived labels only (no "Scenario A/B" defaults).
 */
export function PanelHeader({
  title,
  subtitle,
  accentClassName = "",
  headingLevel = "h2",
}: PanelHeaderProps) {
  const heading =
    headingLevel === "h3" ? (
      <h3 className={`${headingClass} ${accentClassName}`}>{title}</h3>
    ) : (
      <h2 className={`${headingClass} ${accentClassName}`}>{title}</h2>
    );

  return (
    <header className="min-h-[2.75rem] shrink-0">
      {heading}
      {subtitle ? (
        <p className="mt-1 line-clamp-2 text-caption text-text-dim">{subtitle}</p>
      ) : null}
    </header>
  );
}
