"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useMemo, useState, type RefObject } from "react";

function particleFill(t: number): string {
  const h = 145 - t * 145;
  return `hsl(${h} 65% 48%)`;
}

type ParticleAlongPathProps = {
  pathRef: RefObject<SVGPathElement | null>;
  delaySec: number;
  durationSec: number;
};

function ParticleAlongPath({ pathRef, delaySec, durationSec }: ParticleAlongPathProps) {
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const fill = useMotionValue(particleFill(0));
  const reduced = useReducedMotion();
  const [reducedPoint, setReducedPoint] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!reduced) return;
    const el = pathRef.current;
    if (!el || typeof el.getTotalLength !== "function") return;
    const len = el.getTotalLength();
    const p = el.getPointAtLength(0.42 * len);
    setReducedPoint({ x: p.x, y: p.y });
  }, [reduced, pathRef]);

  useLayoutEffect(() => {
    if (reduced) return undefined;
    const path = pathRef.current;
    if (!path || typeof path.getTotalLength !== "function") return undefined;
    const len = path.getTotalLength();
    const ctrl = animate(0, 1, {
      duration: durationSec,
      repeat: Infinity,
      ease: "linear",
      delay: delaySec,
      onUpdate: (t) => {
        const p = path.getPointAtLength(t * len);
        cx.set(p.x);
        cy.set(p.y);
        fill.set(particleFill(t));
      },
    });
    return () => ctrl.stop();
  }, [cx, cy, fill, delaySec, durationSec, reduced, pathRef]);

  if (reduced) {
    if (!reducedPoint) return null;
    return (
      <circle
        cx={reducedPoint.x}
        cy={reducedPoint.y}
        r={3}
        fill={particleFill(0.42)}
        opacity={0.9}
      />
    );
  }

  return <motion.circle cx={cx} cy={cy} r={3.2} style={{ fill }} />;
}

type ParticlesProps = {
  pathRefs: Array<RefObject<SVGPathElement | null>>;
  particleDurationSec: number[];
  flowVolume: number[];
};

export function Particles({ pathRefs, particleDurationSec, flowVolume }: ParticlesProps) {
  const reduced = useReducedMotion();

  const configs = useMemo(() => {
    const stagger = reduced ? 0 : 0.2;
    const out: { pathIndex: number; delay: number; duration: number; key: string }[] = [];
    pathRefs.forEach((_, pi) => {
      const count = reduced
        ? 1
        : Math.max(1, Math.round(3 * (0.45 + flowVolume[pi])));
      for (let k = 0; k < count; k++) {
        out.push({
          pathIndex: pi,
          delay: k * stagger,
          duration: particleDurationSec[pi],
          key: `${pi}-${k}`,
        });
      }
    });
    return out;
  }, [pathRefs, particleDurationSec, flowVolume, reduced]);

  return (
    <g data-testid="flow-particles" aria-hidden>
      {configs.map((c) => {
        const ref = pathRefs[c.pathIndex];
        if (!ref) return null;
        return (
          <ParticleAlongPath
            key={c.key}
            pathRef={ref}
            delaySec={c.delay}
            durationSec={c.duration}
          />
        );
      })}
    </g>
  );
}
