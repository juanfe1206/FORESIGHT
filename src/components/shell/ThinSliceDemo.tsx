"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  RUN_MOCK_MS,
  initialUiShellState,
  isUiRunStatus,
  isUiStage,
  type UiRunStatus,
  type UiStage,
} from "@/lib/ui-state";
import { UiShellContext } from "@/lib/ui-shell-context";
import { buildThinSliceMockComparison } from "@/lib/thin-slice-mock";
import { CenterPanelSlot, LeftPanelSlot, RightPanelSlot } from "./PanelSlots";
import { SimulationShell } from "./SimulationShell";

const springTransition = { type: "spring" as const, stiffness: 320, damping: 28 };

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const runCardClassLeft =
  "order-1 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-1";
const runCardClassCenter =
  "order-2 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-2";
const runCardClassRight =
  "order-3 flex min-h-48 flex-col rounded-xl border border-border bg-surface p-4 lg:order-3";

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
  const isDevPreviewEnabled = process.env.NODE_ENV !== "production";

  // P2: Guard queueMicrotask setter against component unmount
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const [uiStage, setUiStage] = useState<UiStage>(initialUiShellState.uiStage);
  const [runStatus, setRunStatus] = useState<UiRunStatus>(initialUiShellState.runStatus);
  const [decision, setDecision] = useState("");
  const [pathLabels, setPathLabels] = useState<[string, string]>(["Path A", "Path B"]);

  const mockComparison = useMemo(
    () => buildThinSliceMockComparison(pathLabels[0], pathLabels[1]),
    [pathLabels],
  );

  useEffect(() => {
    if (uiStage !== "running" || runStatus !== "inProgress") return;
    const id = window.setTimeout(() => {
      setUiStage("dashboard");
      setRunStatus("completed");
    }, RUN_MOCK_MS);
    return () => window.clearTimeout(id);
  }, [uiStage, runStatus]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setPathLabels(derivePathLabels(decision));
      setUiStage("running");
      setRunStatus("submitting");
      // P2: Check mount status before the async state update
      queueMicrotask(() => { if (isMountedRef.current) setRunStatus("inProgress"); });
    },
    [decision],
  );

  const resetToInput = useCallback(() => {
    setUiStage("input");
    setRunStatus("idle");
    setDecision("");
  }, []);

  const onDevUiStageChange = useCallback((next: UiStage) => {
    setUiStage(next);
    if (next === "input") setRunStatus("idle");
    else if (next === "running") setRunStatus("inProgress");
    else if (next === "dashboard") setRunStatus("completed");
    else if (next === "deepDive") setRunStatus("idle");
  }, []);

  // D2: Bidirectional reconciliation — runStatus change also infers the matching uiStage
  const onDevRunStatusChange = useCallback((next: UiRunStatus) => {
    setRunStatus(next);
    if (next === "idle") setUiStage("input");
    else if (next === "submitting" || next === "inProgress") setUiStage("running");
    else if (next === "completed") setUiStage("dashboard");
    // "error" and "fallback" leave uiStage unchanged so the stage shell stays visible beneath the banner
  }, []);

  // P1: Runtime-validated select handlers — guard against stale option strings after future enum changes
  const handleUiStageSelectChange = useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const v = ev.target.value;
      if (isUiStage(v)) onDevUiStageChange(v);
    },
    [onDevUiStageChange],
  );

  const handleRunStatusSelectChange = useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const v = ev.target.value;
      if (isUiRunStatus(v)) onDevRunStatusChange(v);
    },
    [onDevRunStatusChange],
  );

  return (
    // D1: Provide live uiStage / runStatus to the subtree (satisfies AC1)
    <UiShellContext.Provider value={{ uiStage, runStatus, setUiStage, setRunStatus }}>
      <MotionConfig reducedMotion="user">
        <div
          className="flex flex-1 flex-col"
          data-testid="thin-slice-root"
          data-ui-stage={uiStage}
          data-run-status={runStatus}
        >
          <header className="border-b border-border px-6 py-4 lg:px-10">
            <p className="font-heading text-caption uppercase tracking-wider text-text-dim">
              FORESIGHT
            </p>
            <h1 className="font-heading text-h1 text-text">Thin slice demo</h1>
          </header>

          {isDevPreviewEnabled && (
            <div
              role="group"
              aria-label="Dev UI shell preview"
              data-testid="dev-ui-stage-preview"
              className="flex flex-col gap-2 border-b border-dashed border-border bg-surface/80 px-6 py-3 text-caption text-text-dim sm:flex-row sm:flex-wrap sm:items-center lg:px-10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="dev-ui-stage" className="font-medium text-text">
                  Dev: uiStage
                </label>
                {/* P1: validated onChange */}
                <select
                  id="dev-ui-stage"
                  value={uiStage}
                  onChange={handleUiStageSelectChange}
                  className="rounded border border-border bg-bg px-2 py-1 text-body text-text"
                >
                  <option value="input">input</option>
                  <option value="running">running</option>
                  <option value="dashboard">dashboard</option>
                  <option value="deepDive">deepDive</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="dev-run-status" className="font-medium text-text">
                  runStatus
                </label>
                {/* P1: validated onChange */}
                <select
                  id="dev-run-status"
                  value={runStatus}
                  onChange={handleRunStatusSelectChange}
                  data-testid="dev-run-status-preview"
                  className="rounded border border-border bg-bg px-2 py-1 text-body text-text"
                >
                  <option value="idle">idle</option>
                  <option value="submitting">submitting</option>
                  <option value="inProgress">inProgress</option>
                  <option value="completed">completed</option>
                  <option value="fallback">fallback (shell)</option>
                  <option value="error">error (shell)</option>
                </select>
              </div>
              <span className="hidden sm:inline">(non-production only)</span>
            </div>
          )}

          <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
            {/*
              D3: Error/fallback rendered as status banners, NOT as replacements for stage content.
              The stage shell (uiStage branch below) remains visible underneath, preserving AC6:
              dev preview of any uiStage is unobstructed regardless of runStatus.
            */}
            {runStatus === "error" && (
              <div
                data-testid="error-shell"
                role="region"
                aria-label="Error shell"
                className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4"
              >
                <p className="font-heading text-body font-semibold text-text">Error</p>
                <p className="mt-1 text-caption text-text-dim">
                  Deterministic placeholder — Epic wiring will replace this surface.
                </p>
              </div>
            )}
            {runStatus === "fallback" && (
              <div
                data-testid="fallback-shell"
                role="region"
                aria-label="Fallback visualization shell"
                className="mb-4 rounded-xl border border-dashed border-border bg-surface px-5 py-4"
              >
                <p className="font-heading text-body font-semibold text-text">Fallback</p>
                <p className="mt-1 text-caption text-text-dim">
                  Deterministic placeholder for fallback viz routing.
                </p>
              </div>
            )}

            {/* Stage shell — always rendered; error/fallback banners sit above as overlays */}
            <AnimatePresence mode="wait">
              {uiStage === "input" && (
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

              {uiStage === "running" && (
                <motion.section
                  key="running"
                  role="region"
                  aria-label="Simulation running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springTransition}
                  className="flex flex-1 flex-col"
                >
                  <SimulationShell
                    leftAriaLabel="Path A visualization slot"
                    centerAriaLabel="Agent HUD and progress slot"
                    rightAriaLabel="Path B visualization slot"
                    left={
                      <motion.article
                        {...panelMotion}
                        transition={springTransition}
                        className={runCardClassLeft}
                      >
                        <h2 className="font-heading text-h3 text-accent">{pathLabels[0]}</h2>
                        <p className="mt-2 text-caption text-text-dim">Path A — framing</p>
                      </motion.article>
                    }
                    center={
                      <motion.article
                        {...panelMotion}
                        transition={{ ...springTransition, delay: 0.05 }}
                        className={runCardClassCenter}
                      >
                        <h2 className="font-heading text-h3 text-text">Intelligence</h2>
                        <p className="mt-auto text-body text-text-dim">Simulating…</p>
                      </motion.article>
                    }
                    right={
                      <motion.article
                        {...panelMotion}
                        transition={{ ...springTransition, delay: 0.1 }}
                        className={runCardClassRight}
                      >
                        <h2 className="font-heading text-h3 text-blue">{pathLabels[1]}</h2>
                        <p className="mt-2 text-caption text-text-dim">Path B — framing</p>
                      </motion.article>
                    }
                  />
                </motion.section>
              )}

              {uiStage === "dashboard" && (
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
                    <LeftPanelSlot
                      aria-label="Path A summary and KPI slot"
                      className="order-1 lg:order-1"
                    >
                      <motion.div {...panelMotion} transition={springTransition} className="h-full">
                        <KpiCard
                          title={mockComparison.pathA.label}
                          subtitle="Path A"
                          kpis={mockComparison.pathA.kpis}
                          accentClass="text-accent"
                        />
                      </motion.div>
                    </LeftPanelSlot>
                    <CenterPanelSlot
                      aria-label="KPI stack and comparison slot"
                      className="order-2 flex flex-col justify-center lg:order-2"
                    >
                      <motion.div
                        {...panelMotion}
                        transition={{ ...springTransition, delay: 0.05 }}
                        className="rounded-xl border border-border bg-surface p-6 text-center"
                      >
                        <p className="font-heading text-h3 text-text">Comparison</p>
                        <p className="mt-2 text-caption text-text-dim">
                          Mock outcome — no API calls in this slice
                        </p>
                      </motion.div>
                    </CenterPanelSlot>
                    <RightPanelSlot
                      aria-label="Path B summary and KPI slot"
                      className="order-3 lg:order-3"
                    >
                      <motion.div
                        {...panelMotion}
                        transition={{ ...springTransition, delay: 0.1 }}
                        className="h-full"
                      >
                        <KpiCard
                          title={mockComparison.pathB.label}
                          subtitle="Path B"
                          kpis={mockComparison.pathB.kpis}
                          accentClass="text-blue"
                        />
                      </motion.div>
                    </RightPanelSlot>
                  </div>
                  <button
                    type="button"
                    onClick={resetToInput}
                    className="self-start rounded-lg border border-border px-4 py-2 text-caption text-text hover:border-accent"
                  >
                    Start over
                  </button>
                </motion.section>
              )}

              {uiStage === "deepDive" && (
                <motion.section
                  key="deepDive"
                  role="region"
                  aria-label="Deep dive shell"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)] lg:gap-6"
                  data-testid="deep-dive-shell"
                >
                  <LeftPanelSlot
                    aria-label="Deep dive compressed Path A strip"
                    className="min-h-24 rounded-xl border border-border bg-surface p-3 lg:min-h-auto"
                  >
                    <p className="text-caption text-text-dim">Compressed strip — Path A context</p>
                  </LeftPanelSlot>
                  <CenterPanelSlot
                    aria-label="Deep dive narrative and tab container slot"
                    className="min-h-64 rounded-xl border border-border bg-surface p-6 lg:min-h-auto"
                  >
                    <p className="font-heading text-h3 text-text">Deep dive</p>
                    <p className="mt-2 text-body text-text-dim">
                      Expanded center — narrative / tabs mount here (skeletal).
                    </p>
                  </CenterPanelSlot>
                  <RightPanelSlot
                    aria-label="Deep dive compressed Path B strip"
                    className="min-h-24 rounded-xl border border-border bg-surface p-3 lg:min-h-auto"
                  >
                    <p className="text-caption text-text-dim">Compressed strip — Path B context</p>
                  </RightPanelSlot>
                </motion.section>
              )}

              {/* P3: Exhaustive fallback — TypeScript union guarantees this is unreachable,
                  but guards against invalid values introduced via unchecked casts at runtime. */}
              {!["input", "running", "dashboard", "deepDive"].includes(uiStage) && (
                <div key="unknown" role="region" aria-label="Unknown stage">
                  <p className="text-caption text-text-dim">Unknown uiStage — check state.</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </MotionConfig>
    </UiShellContext.Provider>
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
