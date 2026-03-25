import { motion, useReducedMotion } from "framer-motion";

type ResourcePoolProps = {
  fill: number;
  displayAmount: string;
};

export function ResourcePool({ fill, displayAmount }: ResourcePoolProps) {
  const reduced = useReducedMotion();

  return (
    <div
      data-testid="flow-resource-pool"
      className="mb-2 rounded-md border border-border/50 bg-surface/50 px-2 py-1.5"
    >
      <div className="flex items-center justify-between gap-2 text-caption text-text-dim">
        <span className="font-medium text-text">Resource pool</span>
        <span className="font-mono text-kpi text-accent tabular-nums">{displayAmount}</span>
      </div>
      <div
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-bg/80"
        aria-hidden
      >
        {reduced ? (
          <div
            className="h-full rounded-full bg-accent/90"
            style={{ width: `${fill * 100}%` }}
          />
        ) : (
          <motion.div
            className="h-full rounded-full bg-accent/90"
            initial={false}
            animate={{ width: `${fill * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        )}
      </div>
    </div>
  );
}
