import { motion, useReducedMotion } from "framer-motion";
import type { FlowOutcomeModel } from "./flowVizModel";

const LAYOUT: { x: number; w: number }[] = [
  { x: 44, w: 76 },
  { x: 142, w: 76 },
  { x: 240, w: 76 },
];

type OutcomePoolsProps = {
  outcomes: FlowOutcomeModel[];
};

export function OutcomePools({ outcomes }: OutcomePoolsProps) {
  const reduced = useReducedMotion();
  const maxInner = 40;

  return (
    <g data-testid="flow-outcomes" role="group" aria-label="Outcome pools">
      <defs>
        <linearGradient id="outcome-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.85} />
          <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0.45} />
        </linearGradient>
      </defs>
      {outcomes.map((o, i) => {
        const { x, w } = LAYOUT[i] ?? LAYOUT[1];
        const fillH = Math.max(4, o.fill * maxInner);
        const baseY = 268;
        const poolH = 48;
        const innerY = baseY + poolH - 6 - fillH;

        return (
          <g key={o.id} data-testid={`flow-outcome-${o.id}`}>
            <rect
              x={x}
              y={baseY}
              width={w}
              height={poolH}
              rx={6}
              fill="var(--color-surface)"
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            {reduced ? (
              <rect
                x={x + 5}
                y={innerY}
                width={w - 10}
                height={fillH}
                rx={3}
                fill="url(#outcome-fill)"
                opacity={0.9}
              />
            ) : (
              <motion.rect
                x={x + 5}
                y={innerY}
                width={w - 10}
                height={fillH}
                rx={3}
                fill="url(#outcome-fill)"
                initial={false}
                animate={{ height: fillH, y: innerY }}
                transition={{ type: "spring", stiffness: 100, damping: 16 }}
              />
            )}
            <text
              x={x + w / 2}
              y={baseY + 14}
              className="fill-text-dim"
              style={{ fontSize: "10px" }}
              textAnchor="middle"
            >
              {o.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
