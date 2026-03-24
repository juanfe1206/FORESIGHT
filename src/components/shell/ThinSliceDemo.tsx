"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { buildThinSliceMockComparison } from "@/lib/thin-slice-mock";

type Stage = "input" | "running" | "dashboard";

const RUN_MS = 1800;

const springTransition = { type: "spring" as const, stiffness: 320, damping: 28 };

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function derivePathLabels(decision: string): [string, string] {
  const d = decision.trim();
  if (!d) return ["Path A", "Path B"];

  const vsMatch = /\s+vs\.?\s+/i.exec(d);
  if (vsMatch) {
    const parts = d.split(vsMatch[0]).map((s) => s.trim());
    if (parts.length >= 2) {
      const a = parts[0].slice(0, 48) || "Path A";
      const b = parts[1].slice(0, 48) || "Path B";
      return [a, b];
    }
  }

  const pipe = d
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (pipe.length >= 2) {
    return [pipe[0].slice(0, 48), pipe[1].slice(0, 48)];
  }

  return ["Path A", "Path B"];
}

export function ThinSliceDemo() {
  const [stage, setStage] = useState<Stage>("input");
  const [decision, setDecision] = useState("");
  const [pathLabels, setPathLabels] = useState<[string, string]>(["Path A", "Path B"]);

  const mockComparison = useMemo(
    () => buildThinSliceMockComparison(pathLabels[0], pathLabels[1]),
    [pathLabels],
  );

  useEffect(() => {
    if (stage !== "running") return;
    const id = window.setTimeout(() => setStage("dashboard"), RUN_MS);
    return () => window.clearTimeout(id);
  }, [stage]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setPathLabels(derivePathLabels(decision));
      setStage("running");
    },
    [decision],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border px-6 py-4 lg:px-10">
          <p className="font-heading text-caption uppercase tracking-wider text-text-dim">
            FORESIGHT
          </p>
          <h1 className="font-heading text-h1 text-text">Thin slice demo</h1>
        </header>

        <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
          <AnimatePresence mode="wait">
            {stage === "input" && (
              <motion.section
                key="input"
                role="region"
                aria-label="Decision input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={springTransition}
                className="mx-auto w-full max-w-xl"
              >
                <form onSubmit={onSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="decision" className="text-caption font-medium text-text">
                      Decision
                    </label>
                    <textarea
                      id="decision"
                      required
                      rows={4}
                      value={decision}
                      onChange={(ev) => setDecision(ev.target.value)}
                      placeholder="e.g. Expand to Austin vs stay regional"
                      className="rounded-lg border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus-visible:border-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-6 py-3 font-heading text-body font-semibold text-bg transition hover:opacity-90"
                  >
                    Simulate My Decision
                  </button>
                </form>
              </motion.section>
            )}

            {stage === "running" && (
              <motion.section
                key="running"
                role="region"
                aria-label="Simulation running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springTransition}
                className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6"
              >
                <motion.article
                  {...panelMotion}
                  transition={springTransition}
                  className="order-1 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-1"
                >
                  <h2 className="font-heading text-h3 text-accent">{pathLabels[0]}</h2>
                  <p className="mt-2 text-caption text-text-dim">Path A — framing</p>
                </motion.article>
                <motion.article
                  {...panelMotion}
                  transition={{ ...springTransition, delay: 0.05 }}
                  className="order-2 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-2"
                >
                  <h2 className="font-heading text-h3 text-text">Intelligence</h2>
                  <p className="mt-auto text-body text-text-dim">Simulating…</p>
                </motion.article>
                <motion.article
                  {...panelMotion}
                  transition={{ ...springTransition, delay: 0.1 }}
                  className="order-3 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-3"
                >
                  <h2 className="font-heading text-h3 text-blue">{pathLabels[1]}</h2>
                  <p className="mt-2 text-caption text-text-dim">Path B — framing</p>
                </motion.article>
              </motion.section>
            )}

            {stage === "dashboard" && (
              <motion.section
                key="dashboard"
                role="region"
                aria-label="Mock comparison dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
                className="flex flex-1 flex-col gap-6"
              >
                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                  <motion.div
                    {...panelMotion}
                    transition={springTransition}
                    className="order-1 lg:order-1"
                  >
                    <KpiCard
                      title={mockComparison.pathA.label}
                      subtitle="Path A"
                      kpis={mockComparison.pathA.kpis}
                      accentClass="text-accent"
                    />
                  </motion.div>
                  <motion.div
                    {...panelMotion}
                    transition={{ ...springTransition, delay: 0.05 }}
                    className="order-2 flex flex-col justify-center lg:order-2"
                  >
                    <div className="rounded-xl border border-border bg-surface p-6 text-center">
                      <p className="font-heading text-h3 text-text">Comparison</p>
                      <p className="mt-2 text-caption text-text-dim">
                        Mock outcome — no API calls in this slice
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    {...panelMotion}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="order-3 lg:order-3"
                  >
                    <KpiCard
                      title={mockComparison.pathB.label}
                      subtitle="Path B"
                      kpis={mockComparison.pathB.kpis}
                      accentClass="text-blue"
                    />
                  </motion.div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStage("input");
                    setDecision("");
                  }}
                  className="self-start rounded-lg border border-border px-4 py-2 text-caption text-text hover:border-accent"
                >
                  Start over
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}

function KpiCard({
  title,
  subtitle,
  kpis,
  accentClass,
}: {
  title: string;
  subtitle: string;
  kpis: { revenue: string; risk: string; timeToValue: string; confidence: string };
  accentClass: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className={`font-heading text-h3 ${accentClass}`}>{title}</h3>
      <p className="text-caption text-text-dim">{subtitle}</p>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-caption">
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          <dt className="text-text-dim">Revenue (mock)</dt>
          <dd className="font-mono text-kpi text-text">{kpis.revenue}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          <dt className="text-text-dim">Risk</dt>
          <dd className="font-mono text-kpi text-text">{kpis.risk}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          <dt className="text-text-dim">Time to value</dt>
          <dd className="font-mono text-kpi text-text">{kpis.timeToValue}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          <dt className="text-text-dim">Confidence</dt>
          <dd className="font-mono text-kpi text-gold">{kpis.confidence}</dd>
        </div>
      </dl>
    </div>
  );
}
