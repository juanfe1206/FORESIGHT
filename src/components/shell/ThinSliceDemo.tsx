"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { AgentOutput, KPIs, PathSynthesis, SimulationResponse } from "@/lib/types";
import {
  RUN_MOCK_MS,
  initialUiShellState,
  isUiRunStatus,
  isUiStage,
  isVizType,
  type UiRunStatus,
  type UiStage,
} from "@/lib/ui-state";
import { UiShellContext } from "@/lib/ui-shell-context";
import { MOCK_BAKERY_MAP_FIXTURE } from "@/lib/mock-fixture";
import type { VizType } from "@/lib/types";
import { DeepDivePanel, DeepDiveStrip } from "@/components/narrative";
import { MapHalf } from "@/components/viz/MapView";
import { ModeBadge } from "@/components/running/ModeBadge";
import { MOCK_DEEP_DIVE_PROPS } from "@/lib/integration-contracts";
import { CenterPanelSlot, LeftPanelSlot, RightPanelSlot } from "./PanelSlots";
import { SimulationShell } from "./SimulationShell";
import { VizMapSideCanvas } from "./VizMapSideCanvas";

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

function VizOrientationBand({ vizType }: { vizType: VizType }) {
  return (
    <div
      data-testid="viz-orientation-band"
      className="flex shrink-0 items-center border-b border-border pb-3"
    >
      <ModeBadge vizType={vizType} />
    </div>
  );
}

export function ThinSliceDemo() {
  const isDevPreviewEnabled = process.env.NODE_ENV !== "production";

  // P2: Guard queueMicrotask setter against component unmount
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Skip the mock timer when a real API call is in flight
  const isApiCallRef = useRef(false);

  const [uiStage, setUiStage] = useState<UiStage>(initialUiShellState.uiStage);
  const [runStatus, setRunStatus] = useState<UiRunStatus>(initialUiShellState.runStatus);
  const [vizType, setVizType] = useState<VizType>(initialUiShellState.vizType);
  const [decision, setDecision] = useState("");
  const [pathLabels, setPathLabels] = useState<[string, string]>(["Path A", "Path B"]);
  const [agentResults, setAgentResults] = useState<{ A: AgentOutput[]; B: AgentOutput[] } | null>(null);
  const [synthesisResults, setSynthesisResults] = useState<{ A: PathSynthesis; B: PathSynthesis } | null>(null);
  const [kpiResults, setKpiResults] = useState<{ A: KPIs; B: KPIs } | null>(null);
  const [comparison, setComparison] = useState<SimulationResponse["comparison"] | null>(null);
  const [meta, setMeta] = useState<SimulationResponse["meta"] | null>(null);

  useEffect(() => {
    if (uiStage !== "running" || runStatus !== "inProgress") return;
    if (isApiCallRef.current) return;
    const id = window.setTimeout(() => {
      setPathLabels(derivePathLabels(decision));
      setUiStage("dashboard");
      setRunStatus("completed");
    }, RUN_MOCK_MS);
    return () => window.clearTimeout(id);
  }, [uiStage, runStatus, decision]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Optimistic labels shown immediately during the running phase
      const optimisticLabels = derivePathLabels(decision);
      setPathLabels(optimisticLabels);

      isApiCallRef.current = true;
      setUiStage("running");
      setRunStatus("submitting");
      // P2: Check mount status before the async state update
      queueMicrotask(() => { if (isMountedRef.current) setRunStatus("inProgress"); });

      let finalLabels: [string, string] = optimisticLabels;
      let finalStatus: UiRunStatus = "completed";

      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: decision.trim() }),
        });
        const json = await res.json() as Partial<SimulationResponse>;

        if (res.ok && json.path_labels?.A && json.path_labels?.B) {
          finalLabels = [json.path_labels.A, json.path_labels.B];
          if (isVizType(json.viz_type)) setVizType(json.viz_type);

          const agentsA = json.paths?.A?.agents;
          const agentsB = json.paths?.B?.agents;
          if (agentsA?.length && agentsB?.length) {
            setAgentResults({ A: agentsA, B: agentsB });
          }

          const synthA = json.paths?.A?.synthesis;
          const synthB = json.paths?.B?.synthesis;
          if (synthA && synthB) setSynthesisResults({ A: synthA, B: synthB });

          const kpisA = json.paths?.A?.kpis;
          const kpisB = json.paths?.B?.kpis;
          if (kpisA && kpisB) setKpiResults({ A: kpisA, B: kpisB });

          if (json.comparison) setComparison(json.comparison);
          if (json.meta) setMeta(json.meta);
        } else {
          finalStatus = "error";
        }
      } catch {
        finalStatus = "error";
      }

      if (!isMountedRef.current) {
        isApiCallRef.current = false;
        return;
      }

      isApiCallRef.current = false;
      setPathLabels(finalLabels);
      setUiStage("dashboard");
      setRunStatus(finalStatus);
    },
    [decision],
  );

  const resetToInput = useCallback(() => {
    setUiStage("input");
    setRunStatus("idle");
    setVizType(initialUiShellState.vizType);
    setDecision("");
    setAgentResults(null);
    setSynthesisResults(null);
    setKpiResults(null);
    setComparison(null);
    setMeta(null);
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

  const handleVizTypeSelectChange = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    const v = ev.target.value;
    if (isVizType(v)) setVizType(v);
  }, []);

  return (
    // D1: Provide live uiStage / runStatus to the subtree (satisfies AC1)
    <UiShellContext.Provider value={{ uiStage, runStatus, vizType, setUiStage, setRunStatus, setVizType }}>
      <MotionConfig reducedMotion="user">
        <div
          className="flex flex-1 flex-col"
          data-testid="thin-slice-root"
          data-ui-stage={uiStage}
          data-run-status={runStatus}
          data-viz-type={vizType}
        >
          <header className="border-b border-border px-6 py-4 lg:px-10">
            <p className="font-heading text-caption uppercase tracking-wider text-text-dim">
              FORESIGHT
            </p>
            <h1 className="font-heading text-h1 text-text">Simulation</h1>
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
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="dev-viz-type" className="font-medium text-text">
                  vizType
                </label>
                <select
                  id="dev-viz-type"
                  value={vizType}
                  onChange={handleVizTypeSelectChange}
                  data-testid="dev-viz-type-preview"
                  className="rounded border border-border bg-bg px-2 py-1 text-body text-text"
                >
                  <option value="map">map</option>
                  <option value="flow">flow</option>
                  <option value="network">network</option>
                  <option value="fallback">fallback</option>
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
                <p className="font-heading text-body font-semibold text-text">Simulation unavailable</p>
                <p className="mt-1 text-caption text-text-dim">
                  Could not reach the simulation engine — showing estimated results below.
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
                <p className="font-heading text-body font-semibold text-text">Fallback mode</p>
                <p className="mt-1 text-caption text-text-dim">
                  Showing cached results — live simulation unavailable.
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
                  className="flex flex-1 flex-col gap-4"
                >
                  <VizOrientationBand vizType={vizType} />
                  <SimulationShell
                    leftAriaLabel="Path A visualization slot"
                    centerAriaLabel="Agent HUD and progress slot"
                    rightAriaLabel="Path B visualization slot"
                    left={
                      <VizMapSideCanvas side="left" vizType={vizType}>
                        {vizType === "map" ? (
                          <MapHalf
                            viz_type="map"
                            pathData={MOCK_BAKERY_MAP_FIXTURE.paths.A}
                            pathLabel={pathLabels[0]}
                          />
                        ) : (
                          <motion.article
                            {...panelMotion}
                            transition={springTransition}
                            className={runCardClassLeft}
                          >
                            <h2 className="font-heading text-h3 text-accent">{pathLabels[0]}</h2>
                            <p className="mt-2 text-caption text-text-dim">Path A — framing</p>
                          </motion.article>
                        )}
                      </VizMapSideCanvas>
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
                      <VizMapSideCanvas side="right" vizType={vizType}>
                        {vizType === "map" ? (
                          <MapHalf
                            viz_type="map"
                            pathData={MOCK_BAKERY_MAP_FIXTURE.paths.B}
                            pathLabel={pathLabels[1]}
                          />
                        ) : (
                          <motion.article
                            {...panelMotion}
                            transition={{ ...springTransition, delay: 0.1 }}
                            className={runCardClassRight}
                          >
                            <h2 className="font-heading text-h3 text-blue">{pathLabels[1]}</h2>
                            <p className="mt-2 text-caption text-text-dim">Path B — framing</p>
                          </motion.article>
                        )}
                      </VizMapSideCanvas>
                    }
                  />
                </motion.section>
              )}

              {uiStage === "dashboard" && (
                <motion.section
                  key="dashboard"
                  role="region"
                  aria-label="Comparison dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className="flex flex-1 flex-col gap-4"
                >
                  <VizOrientationBand vizType={vizType} />
                  <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <LeftPanelSlot
                      aria-label="Path A summary and KPI slot"
                      className="order-1 lg:order-1"
                    >
                      <VizMapSideCanvas side="left" vizType={vizType}>
                        <motion.div {...panelMotion} transition={springTransition} className="flex flex-col gap-4">
                          <KpiCard
                            title={pathLabels[0]}
                            subtitle="Path A"
                            kpis={kpiResults?.A ?? null}
                            isWinner={comparison?.overallWinner === "A"}
                            accentClass="text-accent"
                          />
                          {synthesisResults?.A && (
                            <SynthesisSummary summary={synthesisResults.A.summary} accentClass="text-accent" />
                          )}
                          {agentResults?.A && (
                            <AgentInsightList agents={agentResults.A} accentClass="text-accent" />
                          )}
                        </motion.div>
                      </VizMapSideCanvas>
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
                        {vizType && (
                          <span className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 font-mono text-caption uppercase tracking-wide text-accent">
                            {vizType}
                          </span>
                        )}
                        {comparison ? (
                          <div className="mt-4 flex flex-col gap-2">
                            <p className="text-caption text-text-dim">Overall winner</p>
                            <p className={`font-heading text-h3 ${comparison.overallWinner === "A" ? "text-accent" : "text-blue"}`}>
                              {comparison.overallWinner === "A" ? pathLabels[0] : pathLabels[1]}
                            </p>
                            {meta && (
                              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                                <div>
                                  <dt className="text-caption text-text-dim">Latency</dt>
                                  <dd className="font-mono text-caption text-text">{meta.latencyMs}ms</dd>
                                </div>
                                <div>
                                  <dt className="text-caption text-text-dim">LLM calls</dt>
                                  <dd className="font-mono text-caption text-text">{meta.llmCalls}</dd>
                                </div>
                                <div>
                                  <dt className="text-caption text-text-dim">Est. cost</dt>
                                  <dd className="font-mono text-caption text-text">€{meta.estimatedCostEur.toFixed(2)}</dd>
                                </div>
                              </dl>
                            )}
                          </div>
                        ) : (
                          <p className="mt-3 text-caption text-text-dim">
                            {agentResults ? "Agents: live · awaiting synthesis" : "Awaiting simulation results"}
                          </p>
                        )}
                      </motion.div>
                    </CenterPanelSlot>
                    <RightPanelSlot
                      aria-label="Path B summary and KPI slot"
                      className="order-3 lg:order-3"
                    >
                      <VizMapSideCanvas side="right" vizType={vizType}>
                        <motion.div
                          {...panelMotion}
                          transition={{ ...springTransition, delay: 0.1 }}
                          className="flex flex-col gap-4"
                        >
                          <KpiCard
                            title={pathLabels[1]}
                            subtitle="Path B"
                            kpis={kpiResults?.B ?? null}
                            isWinner={comparison?.overallWinner === "B"}
                            accentClass="text-blue"
                          />
                          {synthesisResults?.B && (
                            <SynthesisSummary summary={synthesisResults.B.summary} accentClass="text-blue" />
                          )}
                          {agentResults?.B && (
                            <AgentInsightList agents={agentResults.B} accentClass="text-blue" />
                          )}
                        </motion.div>
                      </VizMapSideCanvas>
                    </RightPanelSlot>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                    <button
                      type="button"
                      data-testid="read-full-story-btn"
                      onClick={() => setUiStage("deepDive")}
                      className="min-h-10 rounded-lg bg-accent px-6 py-3 font-heading text-body font-semibold text-bg transition hover:opacity-90"
                    >
                      Read Full Story
                    </button>
                    <button
                      type="button"
                      onClick={resetToInput}
                      className="min-h-10 rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent"
                    >
                      Start over
                    </button>
                  </div>
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
                  className="flex flex-1 flex-col gap-4"
                >
                  <VizOrientationBand vizType={vizType} />
                  <div
                    className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)] lg:gap-6"
                    data-testid="deep-dive-shell"
                  >
                    <LeftPanelSlot
                      aria-label="Deep dive compressed Path A strip"
                      className="min-h-24 rounded-xl border border-border bg-surface p-3 lg:min-h-auto"
                    >
                      <VizMapSideCanvas side="left" vizType={vizType}>
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={springTransition}
                          className="h-full"
                        >
                          <DeepDiveStrip
                            pathLabel={pathLabels[0]}
                            score={MOCK_DEEP_DIVE_PROPS.pathA.kpis.overallScore}
                            summary={MOCK_DEEP_DIVE_PROPS.pathA.synthesis.summary}
                          />
                        </motion.div>
                      </VizMapSideCanvas>
                    </LeftPanelSlot>
                    <CenterPanelSlot
                      aria-label="Deep dive narrative and tab container slot"
                      className="min-h-64 rounded-xl border border-border bg-surface p-6 lg:min-h-auto"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: 0.05 }}
                        className="h-full min-h-0"
                      >
                        <DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type={vizType} />
                      </motion.div>
                    </CenterPanelSlot>
                    <RightPanelSlot
                      aria-label="Deep dive compressed Path B strip"
                      className="min-h-24 rounded-xl border border-border bg-surface p-3 lg:min-h-auto"
                    >
                      <VizMapSideCanvas side="right" vizType={vizType}>
                        <motion.div
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={springTransition}
                          className="h-full"
                        >
                          <DeepDiveStrip
                            pathLabel={pathLabels[1]}
                            score={MOCK_DEEP_DIVE_PROPS.pathB.kpis.overallScore}
                            summary={MOCK_DEEP_DIVE_PROPS.pathB.synthesis.summary}
                          />
                        </motion.div>
                      </VizMapSideCanvas>
                    </RightPanelSlot>
                  </div>
                  <button
                    type="button"
                    data-testid="back-to-dashboard-btn"
                    onClick={() => setUiStage("dashboard")}
                    className="w-full rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent sm:mx-auto sm:max-w-xs sm:w-auto"
                  >
                    ← Back to comparison
                  </button>
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

function AgentInsightList({ agents, accentClass }: { agents: AgentOutput[]; accentClass: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-heading text-caption font-semibold uppercase tracking-wider text-text-dim">
        Agent Insights
        <span className="ml-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 font-mono text-caption normal-case tracking-normal text-accent">
          live
        </span>
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.role} className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-caption font-medium ${accentClass}`}>{agent.role}</span>
              <span className="font-mono text-caption text-text-dim">
                {Math.round(agent.confidence * 100)}%{" "}
                <span className="text-text-dim/60">{agent.grounding}</span>
              </span>
            </div>
            <p className="mt-1 text-caption text-text-dim">{agent.insight}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiCard({
  title,
  subtitle,
  kpis,
  isWinner,
  accentClass,
}: {
  title: string;
  subtitle: string;
  kpis: KPIs | null;
  isWinner: boolean;
  accentClass: string;
}) {
  return (
    <div className={`flex flex-col rounded-xl border bg-surface p-4 ${isWinner ? "border-accent/60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`font-heading text-h3 ${accentClass}`}>{title}</h3>
          <p className="text-caption text-text-dim">{subtitle}</p>
        </div>
        {isWinner && (
          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-caption text-accent">
            winner
          </span>
        )}
      </div>
      {kpis ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-caption">
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <dt className="text-text-dim">Overall score</dt>
            <dd className="font-mono text-kpi text-text">{kpis.overallScore}<span className="text-text-dim">/100</span></dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <dt className="text-text-dim">Revenue impact</dt>
            <dd className={`font-mono text-kpi ${kpis.revenueImpact >= 0 ? "text-text" : "text-red-400"}`}>
              {kpis.revenueImpact >= 0 ? "+" : ""}{kpis.revenueImpact}%
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <dt className="text-text-dim">Risk</dt>
            <dd className="font-mono text-kpi text-text">{kpis.risk}<span className="text-text-dim">/100</span></dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <dt className="text-text-dim">Customer impact</dt>
            <dd className="font-mono text-kpi text-text">{kpis.customerImpact}<span className="text-text-dim">/100</span></dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <dt className="text-text-dim">Opportunity cost</dt>
            <dd className="text-right text-caption text-text-dim">{kpis.opportunityCost}</dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-caption">
          {["Overall score", "Revenue impact", "Risk", "Customer impact"].map((label) => (
            <div key={label} className="flex justify-between gap-2 border-t border-border pt-3">
              <dt className="text-text-dim">{label}</dt>
              <dd className="h-4 w-16 animate-pulse rounded bg-border" />
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function SynthesisSummary({ summary, accentClass }: { summary: string; accentClass: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className={`font-heading text-caption font-semibold uppercase tracking-wider ${accentClass}`}>
        Synthesis
      </p>
      <p className="mt-2 text-caption text-text-dim leading-relaxed">{summary}</p>
    </div>
  );
}
