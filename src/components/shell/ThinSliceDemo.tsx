"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotionConfig,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DecisionForm,
  emptyDecisionFormState,
  type DecisionFormInputState,
} from "@/components/input/DecisionForm";
import type { AgentOutput, KPIs, PathSynthesis, SimulationResponse } from "@/lib/types";
import type { SimulationRequest } from "@/lib/types";
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
import { AgentHUD } from "@/components/agents/AgentHUD";
import { KpiStack } from "@/components/dashboard/KpiStack";
import { ScoreRing } from "@/components/dashboard/ScoreRing";
import { READ_FULL_STORY_DELAY_S } from "@/lib/dashboard-choreography";
import { MOCK_KPI_STACK_PROPS, MOCK_DEEP_DIVE_PROPS } from "@/lib/integration-contracts";
import type { KpiStackSlotProps } from "@/lib/integration-contracts";
import { VizRouter } from "@/components/viz/VizRouter";
import { AGENT_ROLES } from "@/lib/types";
import type { AgentState, VizType } from "@/lib/types";
import { MOCK_BAKERY_MAP_FIXTURE } from "@/lib/mock-fixture";
import { derivePathLabels } from "@/lib/derive-path-labels";
import { DeepDivePanel, DeepDiveStrip } from "@/components/narrative";
import { MapHalf } from "@/components/viz/MapView";
import { ModeBadge } from "@/components/running/ModeBadge";
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
  const reducedMotionResolved = useReducedMotionConfig();
  const reduceMotion = reducedMotionResolved === true;
  const readStoryDelay = reduceMotion ? 0 : READ_FULL_STORY_DELAY_S;

  const inputExitTransition = reduceMotion
    ? { duration: 0.08 }
    : { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const };

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const isApiCallRef = useRef(false);

  const [uiStage, setUiStage] = useState<UiStage>(initialUiShellState.uiStage);
  const [runStatus, setRunStatus] = useState<UiRunStatus>(initialUiShellState.runStatus);
  const [vizType, setVizType] = useState<VizType>(initialUiShellState.vizType);
  const [form, setForm] = useState<DecisionFormInputState>(emptyDecisionFormState);
  const [pathLabels, setPathLabels] = useState<[string, string]>(["Path A", "Path B"]);
  const [agentResults, setAgentResults] = useState<{ A: AgentOutput[]; B: AgentOutput[] } | null>(null);
  const [synthesisResults, setSynthesisResults] = useState<{ A: PathSynthesis; B: PathSynthesis } | null>(null);
  const [kpiResults, setKpiResults] = useState<{ A: KPIs; B: KPIs } | null>(null);
  const [comparison, setComparison] = useState<SimulationResponse["comparison"] | null>(null);
  const [meta, setMeta] = useState<SimulationResponse["meta"] | null>(null);

  const dormantRow = useMemo(
    (): [AgentState, AgentState, AgentState, AgentState] => [
      "dormant",
      "dormant",
      "dormant",
      "dormant",
    ],
    [],
  );

  const [agentStatesByPath, setAgentStatesByPath] = useState<{
    A: AgentState[];
    B: AgentState[];
  }>(() => ({ A: [...dormantRow], B: [...dormantRow] }));

  const insightsByPath = useMemo(() => {
    const short = (s: string) => s.trim().split(/\s+/).slice(0, 4).join(" ");
    return {
      A: MOCK_BAKERY_MAP_FIXTURE.paths.A.agents.map((a) => short(a.insight)),
      B: MOCK_BAKERY_MAP_FIXTURE.paths.B.agents.map((a) => short(a.insight)),
    };
  }, []);

  const hudPathLabels = useMemo(
    () => ({ A: pathLabels[0], B: pathLabels[1] }),
    [pathLabels],
  );

  const deepDiveProps = (synthesisResults && kpiResults && agentResults)
    ? {
        pathA: { agents: agentResults.A, synthesis: synthesisResults.A, kpis: kpiResults.A },
        pathB: { agents: agentResults.B, synthesis: synthesisResults.B, kpis: kpiResults.B },
        pathLabels: { A: pathLabels[0], B: pathLabels[1] },
      }
    : MOCK_DEEP_DIVE_PROPS;

  const kpiStackProps = useMemo(
    (): KpiStackSlotProps => ({
      ...MOCK_KPI_STACK_PROPS,
      pathLabels: hudPathLabels,
    }),
    [hudPathLabels],
  );

  useEffect(() => {
    if (uiStage !== "running" || runStatus !== "inProgress") return;
    if (isApiCallRef.current) return;

    setAgentStatesByPath({ A: [...dormantRow], B: [...dormantRow] });

    const ids: number[] = [];

    const setSlot = (path: "A" | "B", index: number, state: AgentState) => {
      setAgentStatesByPath((prev) => {
        const nextA = [...prev.A];
        const nextB = [...prev.B];
        if (path === "A") nextA[index] = state;
        else nextB[index] = state;
        return { A: nextA, B: nextB };
      });
    };

    for (let i = 0; i < 4; i++) {
      const baseA = 120 + i * 400;
      ids.push(window.setTimeout(() => setSlot("A", i, "thinking"), baseA));
      ids.push(window.setTimeout(() => setSlot("A", i, "insight"), baseA + 300));
      ids.push(window.setTimeout(() => setSlot("A", i, "complete"), baseA + 620));
    }

    for (let i = 0; i < 4; i++) {
      const baseB = 380 + i * 520;
      ids.push(window.setTimeout(() => setSlot("B", i, "thinking"), baseB));
      ids.push(window.setTimeout(() => setSlot("B", i, "insight"), baseB + 360));
      ids.push(window.setTimeout(() => setSlot("B", i, "complete"), baseB + 720));
    }

    ids.push(
      window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setPathLabels(derivePathLabels(form.decision));
        setUiStage("dashboard");
        setRunStatus("completed");
      }, RUN_MOCK_MS),
    );

    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [uiStage, runStatus, form.decision, dormantRow]);

  const onValidSubmit = useCallback(
    ({ decision, context }: { decision: string; context: SimulationRequest["context"] }) => {
      const optimisticLabels = derivePathLabels(decision);
      setPathLabels(optimisticLabels);

      isApiCallRef.current = true;
      setRunStatus("submitting");

      queueMicrotask(() => {
        if (!isMountedRef.current) return;
        setUiStage("running");
        setRunStatus("inProgress");

        (async () => {
          let finalLabels: [string, string] = optimisticLabels;
          let finalStatus: UiRunStatus = "completed";

          try {
            const res = await fetch("/api/simulate", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ decision: decision.trim(), context }),
            });
            const json = await res.json() as Partial<SimulationResponse>;

            if (res.ok && json.path_labels?.A && json.path_labels?.B) {
              finalLabels = [json.path_labels.A, json.path_labels.B];
              if (json.viz_type !== undefined && isVizType(json.viz_type)) setVizType(json.viz_type);

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
        })();
      });
    },
    [],
  );

  const resetToInput = useCallback(() => {
    setUiStage("input");
    setRunStatus("idle");
    setForm(emptyDecisionFormState);
    setVizType(initialUiShellState.vizType);
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

  const onDevRunStatusChange = useCallback((next: UiRunStatus) => {
    setRunStatus(next);
    if (next === "idle") setUiStage("input");
    else if (next === "submitting") setUiStage("input");
    else if (next === "inProgress") setUiStage("running");
    else if (next === "completed") setUiStage("dashboard");
  }, []);

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="FORESIGHT" height={32} className="h-8 w-auto" />
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

            <AnimatePresence mode="wait">
              {uiStage === "input" && (
                <motion.section
                  key="input"
                  role="region"
                  aria-label="Decision input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: -12 }
                  }
                  transition={inputExitTransition}
                  className="mx-auto w-full max-w-xl"
                >
                  <DecisionForm
                    value={form}
                    onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                    onValidSubmit={onValidSubmit}
                    isSubmitting={runStatus === "submitting"}
                  />
                </motion.section>
              )}

              {uiStage === "running" && (
                <motion.section
                  key="running"
                  role="region"
                  aria-label="Simulation running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: springTransition }}
                  exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
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
                            className={`${runCardClassLeft} min-h-0 flex-1`}
                          >
                            <h2 className="shrink-0 font-heading text-h3 text-accent">{pathLabels[0]}</h2>
                            <div className="mt-3 flex min-h-0 flex-1 flex-col">
                              <VizRouter
                                viz_type={vizType}
                                pathData={MOCK_BAKERY_MAP_FIXTURE.paths.A}
                                pathLabel={pathLabels[0]}
                                agentStates={agentStatesByPath.A}
                              />
                            </div>
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
                        <AgentHUD
                          viz_type={vizType}
                          roles={[...AGENT_ROLES[vizType]]}
                          pathLabels={hudPathLabels}
                          agentStatesByPath={agentStatesByPath}
                          insightsByPath={insightsByPath}
                        />
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
                            className={`${runCardClassRight} min-h-0 flex-1`}
                          >
                            <h2 className="shrink-0 font-heading text-h3 text-blue">{pathLabels[1]}</h2>
                            <div className="mt-3 flex min-h-0 flex-1 flex-col">
                              <VizRouter
                                viz_type={vizType}
                                pathData={MOCK_BAKERY_MAP_FIXTURE.paths.B}
                                pathLabel={pathLabels[1]}
                                agentStates={agentStatesByPath.B}
                              />
                            </div>
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
                        <motion.div {...panelMotion} transition={springTransition} className="h-full">
                          <PathSummaryCard
                            pathLabel={pathLabels[0]}
                            pathId="A"
                            accentClass="text-accent"
                            summary={synthesisResults?.A?.summary ?? MOCK_BAKERY_MAP_FIXTURE.paths.A.synthesis.summary}
                            footer={
                              <ScoreRing
                                score={kpiStackProps.kpisA.overallScore}
                                pathLabel={pathLabels[0]}
                                pathTone="A"
                              />
                            }
                          />
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
                        className="rounded-xl border border-border bg-surface p-4 sm:p-6"
                      >
                        <KpiStack {...kpiStackProps} />
                        {comparison && (
                          <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4">
                            <p className="text-caption text-text-dim">Overall winner</p>
                            <p className={`font-heading text-h3 ${comparison.overallWinner === "A" ? "text-accent" : "text-blue"}`}>
                              {comparison.overallWinner === "A" ? pathLabels[0] : pathLabels[1]}
                            </p>
                            {meta && (
                              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
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
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: readStoryDelay,
                          duration: reduceMotion ? 0.01 : 0.35,
                          ease: "easeOut",
                        }}
                        className="mt-4 flex justify-center px-1"
                      >
                        <button
                          type="button"
                          data-testid="read-full-story-cta"
                          className="rounded-lg bg-accent px-6 py-3 font-heading text-body font-semibold text-bg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          onClick={() => setUiStage("deepDive")}
                        >
                          Read full story
                        </button>
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
                          className="h-full"
                        >
                          <PathSummaryCard
                            pathLabel={pathLabels[1]}
                            pathId="B"
                            accentClass="text-blue"
                            summary={synthesisResults?.B?.summary ?? MOCK_BAKERY_MAP_FIXTURE.paths.B.synthesis.summary}
                            footer={
                              <ScoreRing
                                score={kpiStackProps.kpisB.overallScore}
                                pathLabel={pathLabels[1]}
                                pathTone="B"
                              />
                            }
                          />
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
                            score={deepDiveProps.pathA.kpis.overallScore}
                            summary={deepDiveProps.pathA.synthesis.summary}
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
                        <DeepDivePanel {...deepDiveProps} viz_type={vizType} />
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
                            score={deepDiveProps.pathB.kpis.overallScore}
                            summary={deepDiveProps.pathB.synthesis.summary}
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

function PathSummaryCard({
  pathLabel,
  pathId,
  accentClass,
  summary,
  footer,
}: {
  pathLabel: string;
  pathId: "A" | "B";
  accentClass: string;
  summary: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className={`font-heading text-h3 ${accentClass}`}>{pathLabel}</h3>
      <p className="text-caption text-text-dim">Path {pathId}</p>
      <p className="mt-4 flex-1 text-body leading-snug text-text">{summary}</p>
      {footer ? (
        <div className="mt-6 flex shrink-0 flex-col items-center border-t border-border/50 pt-4">
          {footer}
        </div>
      ) : null}
    </div>
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
