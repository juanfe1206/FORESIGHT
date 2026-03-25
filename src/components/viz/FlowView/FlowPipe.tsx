import type { RefObject } from "react";

type FlowPipeProps = {
  pathD: string;
  strokeWidth: number;
  label: string;
  labelX: number;
  labelY: number;
  pathRef: RefObject<SVGPathElement | null>;
  pipeSqueeze: number;
  testId?: string;
};

export function FlowPipe({
  pathD,
  strokeWidth,
  label,
  labelX,
  labelY,
  pathRef,
  pipeSqueeze,
  testId,
}: FlowPipeProps) {
  const w = Math.max(2.5, strokeWidth * pipeSqueeze);

  return (
    <g data-testid={testId}>
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="var(--color-border)"
        strokeOpacity={0.55}
        strokeWidth={w + 3}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="url(#flow-pipe-gradient)"
        strokeWidth={w}
        strokeLinecap="round"
        opacity={0.92}
      />
      <text
        x={labelX}
        y={labelY}
        className="fill-text-dim"
        style={{ fontSize: "10px" }}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}
