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
import type {
  AgentOutput,
  ErrorResponse,
  KPIs,
  PathData,
  PathSynthesis,
  SimulationRequest,
  SimulationResponse,
} from "@/lib/types";
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
import { MOCK_KPI_STACK_PROPS } from "@/lib/integration-contracts";
import type { KpiStackSlotProps } from "@/lib/integration-contracts";
import { VizRouter } from "@/components/viz/VizRouter";
import { AGENT_ROLES } from "@/lib/types";
import type { AgentState, VizType } from "@/lib/types";
import { DEMO_SCENARIOS, DEMO_SCENARIO_ORDER, type DemoScenarioId } from "@/lib/demo-scenarios";
import { MOCK_BAKERY_MAP_FIXTURE } from "@/lib/mock-fixture";
import { derivePathLabels } from "@/lib/derive-path-labels";
import { DeepDivePanel, DeepDiveStrip } from "@/components/narrative";
import { MapHalf } from "@/components/viz/MapView";
import { ModeBadge } from "@/components/running/ModeBadge";
import { CenterPanelSlot, LeftPanelSlot, RightPanelSlot } from "./PanelSlots";
import { SimulationShell } from "./SimulationShell";
import { SimulationFramingBanner } from "@/components/trust/SimulationFramingBanner";
import { summarizeGroundingDistribution } from "@/lib/format-agent-output";
import { VizMapSideCanvas } from "./VizMapSideCanvas";
import { buildHydrationFromSimulationResponse } from "@/lib/hydrate-simulation-ui";
import { GOLDEN_DEMO_SIMULATION_RESPONSE } from "@/lib/golden/golden-demo-simulation-response";
import { parseSimulationErrorResponse } from "@/lib/parse-simulation-error-response";
import { readLatestValid, writeSuccess } from "@/lib/simulation-client-cache";
import { validateSimulationResponse } from "@/lib/validate-simulation-response";

function isGoldenReplayBundledEnabled(): boolean {
  // Default ON when unset (demo/hackathon); set NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY="false" to disable bundled golden.
  return process.env.NEXT_PUBLIC_ENABLE_GOLDEN_REPLAY !== "false";
}

function shouldAttemptClientReplay(
  useCachedOnFailure: boolean | undefined,
  errorBody: ErrorResponse | null,
): boolean {
  if (useCachedOnFailure === false) return false;
  if (errorBody?.recovery?.canUseCache === false) return false;
  return true;
}

function resolveReplaySimulationResponse(): SimulationResponse | null {
  const cached = readLatestValid();
  if (cached) return cached;
  if (isGoldenReplayBundledEnabled()) return GOLDEN_DEMO_SIMULATION_RESPONSE;
  return null;
}

export type ThinSliceDemoProps = {
  simulationOptions?: SimulationRequest["options"];
};

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

export function ThinSliceDemo({ simulationOptions }: ThinSliceDemoProps = {}) {
  // Demo-scenario controls are dev-only by default, but you can opt-in in production builds
  // by setting NEXT_PUBLIC_FORCE_DEV_PREVIEW="true" in the hosting environment (Vercel).
  const isDevPreviewEnabled =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_FORCE_DEV_PREVIEW === "true";

  // Public demo is for general users: when set, we show exactly one demo scenario button
  // in production builds (intended for demos / tutorials).
  const publicDemoScenarioId: DemoScenarioId | null =
    process.env.NEXT_PUBLIC_PUBLIC_DEMO_SCENARIO_ID &&
    process.env.NEXT_PUBLIC_PUBLIC_DEMO_SCENARIO_ID in DEMO_SCENARIOS
      ? (process.env.NEXT_PUBLIC_PUBLIC_DEMO_SCENARIO_ID as DemoScenarioId)
      : null;

  const reducedMotionResolved = useReducedMotionConfig();
  const reduceMotion = reducedMotionResolved === true;
  const readStoryDelay = reduceMotion ? 0 : READ_FULL_STORY_DELAY_S;

  const inputExitTransition = reduceMotion
    ? { duration: 0.08 }
    : { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const };

  const isMountedRef = useRef(true);
  const replayTimeoutRef = useRef<number | null>(null);
  useEffect(() => () => {
    isMountedRef.current = false;
    if (replayTimeoutRef.current !== null) window.clearTimeout(replayTimeoutRef.current);
  }, []);

  const isApiCallRef = useRef(false);
  const runningStartedAtRef = useRef<number | null>(null);

  const [uiStage, setUiStage] = useState<UiStage>(initialUiShellState.uiStage);
  const [runStatus, setRunStatus] = useState<UiRunStatus>(initialUiShellState.runStatus);
  const [vizType, setVizType] = useState<VizType>(initialUiShellState.vizType);
  const [form, setForm] = useState<DecisionFormInputState>(emptyDecisionFormState);
  const [activeDemoScenarioId, setActiveDemoScenarioId] = useState<DemoScenarioId | null>(null);
  const [pathLabels, setPathLabels] = useState<[string, string]>(["Path A", "Path B"]);
  const [agentResults, setAgentResults] = useState<{ A: AgentOutput[]; B: AgentOutput[] } | null>(null);
  const [synthesisResults, setSynthesisResults] = useState<{ A: PathSynthesis; B: PathSynthesis } | null>(null);
  const [kpiResults, setKpiResults] = useState<{ A: KPIs; B: KPIs } | null>(null);
  const [comparison, setComparison] = useState<SimulationResponse["comparison"] | null>(null);
  const [meta, setMeta] = useState<SimulationResponse["meta"] | null>(null);

  const applyDemoScenarioToForm = useCallback((id: DemoScenarioId) => {
    const s = DEMO_SCENARIOS[id];
    setForm({
      decision: s.decision,
      industry: s.context.industry ?? "",
      monthlyRevenue: s.context.monthlyRevenue != null ? String(s.context.monthlyRevenue) : "",
      location: s.context.location ?? "",
      customerBase: s.context.customerBase ?? "",
      details: s.context.details ?? "",
    });
    setActiveDemoScenarioId(id);
  }, []);

  const applySimulationResponse = useCallback((res: SimulationResponse, cachedReplay: boolean) => {
    const slice = buildHydrationFromSimulationResponse(res, { cachedReplay });
    setVizType(slice.vizType);
    setPathLabels(slice.pathLabels);
    setAgentResults(slice.agentResults);
    setSynthesisResults(slice.synthesisResults);
    setKpiResults(slice.kpiResults);
    setComparison(slice.comparison);
    setMeta(slice.meta);
  }, []);

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

  const hudPathLabels = useMemo(
    () => ({ A: pathLabels[0], B: pathLabels[1] }),
    [pathLabels],
  );

  /** Real PathData for each path — falls back to fixture until API results arrive. */
  const pathDataA = useMemo((): PathData => ({
    agents: agentResults?.A ?? MOCK_BAKERY_MAP_FIXTURE.paths.A.agents,
    synthesis: synthesisResults?.A ?? MOCK_BAKERY_MAP_FIXTURE.paths.A.synthesis,
    kpis: kpiResults?.A ?? MOCK_BAKERY_MAP_FIXTURE.paths.A.kpis,
  }), [agentResults, synthesisResults, kpiResults]);

  const pathDataB = useMemo((): PathData => ({
    agents: agentResults?.B ?? MOCK_BAKERY_MAP_FIXTURE.paths.B.agents,
    synthesis: synthesisResults?.B ?? MOCK_BAKERY_MAP_FIXTURE.paths.B.synthesis,
    kpis: kpiResults?.B ?? MOCK_BAKERY_MAP_FIXTURE.paths.B.kpis,
  }), [agentResults, synthesisResults, kpiResults]);

  const insightsByPath = useMemo(() => {
    const short = (s: string) => s.trim().split(/\s+/).slice(0, 4).join(" ");
    return {
      A: pathDataA.agents.map((a) => short(a.insight)),
      B: pathDataB.agents.map((a) => short(a.insight)),
    };
  }, [pathDataA, pathDataB]);

  const deepDiveProps = useMemo(() => ({
    pathA: pathDataA,
    pathB: pathDataB,
    pathLabels: hudPathLabels,
  }), [pathDataA, pathDataB, hudPathLabels]);

  const kpiStackProps = useMemo(
    (): KpiStackSlotProps => ({
      kpisA: kpiResults?.A ?? MOCK_KPI_STACK_PROPS.kpisA,
      kpisB: kpiResults?.B ?? MOCK_KPI_STACK_PROPS.kpisB,
      comparison: comparison ?? MOCK_KPI_STACK_PROPS.comparison,
      pathLabels: hudPathLabels,
    }),
    [kpiResults, comparison, hudPathLabels],
  );

  useEffect(() => {
    if (uiStage !== "running" || runStatus !== "inProgress") return;
    // Progress updates are predictive client-side timing; live API calls are fire-and-wait.
    // Keep HUD animation active during real runs and suppress only mock dashboard auto-transition.

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

    if (!isApiCallRef.current) {
      ids.push(
        window.setTimeout(() => {
          if (!isMountedRef.current) return;
          setPathLabels(derivePathLabels(form.decision));
          setUiStage("dashboard");
          setRunStatus("completed");
        }, RUN_MOCK_MS),
      );
    }

    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [uiStage, runStatus, form.decision, dormantRow]);

  const onValidSubmit = useCallback(
    ({ decision, context }: { decision: string; context: SimulationRequest["context"] }) => {
      const optimisticLabels = derivePathLabels(decision);
      setPathLabels(optimisticLabels);

      isApiCallRef.current = true;
      setRunStatus("submitting");

      const scheduleReplayDashboard = (resolvedReplay: SimulationResponse) => {
        const startedAt = runningStartedAtRef.current ?? Date.now();
        const delay = Math.max(0, RUN_MOCK_MS - (Date.now() - startedAt));
        replayTimeoutRef.current = window.setTimeout(() => {
          replayTimeoutRef.current = null;
          if (!isMountedRef.current) return;
          isApiCallRef.current = false;
          applySimulationResponse(resolvedReplay, true);
          // When we replay cached/bundled results, the side panels should show FallbackViz
          // and the center HUD should use fallback role labels.
          setVizType("fallback");
          setUiStage("dashboard");
          setRunStatus("fallback");
        }, delay);
      };

      queueMicrotask(() => {
        if (!isMountedRef.current) return;
        runningStartedAtRef.current = Date.now();
        setUiStage("running");
        setRunStatus("inProgress");

        void (async () => {
          try {
            const res = await fetch("/api/simulate", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                decision: decision.trim(),
                context,
                ...(activeDemoScenarioId
                  ? {
                      options: {
                        ...(simulationOptions ?? {}),
                        demoScenarioId: activeDemoScenarioId,
                      },
                    }
                  : simulationOptions
                    ? { options: simulationOptions }
                    : {}),
              }),
            });

            let body: unknown;
            try {
              body = await res.json();
            } catch {
              body = undefined;
            }

            if (!isMountedRef.current) {
              isApiCallRef.current = false;
              return;
            }

            if (res.ok && validateSimulationResponse(body)) {
              applySimulationResponse(body, false);
              writeSuccess(body);
              isApiCallRef.current = false;
              setUiStage("dashboard");
              setRunStatus("completed");
              return;
            }

            const err = parseSimulationErrorResponse(body);
            const failureReplay = shouldAttemptClientReplay(simulationOptions?.useCachedOnFailure, err)
              ? resolveReplaySimulationResponse()
              : null;
            if (failureReplay) {
              scheduleReplayDashboard(failureReplay);
              return;
            }

            isApiCallRef.current = false;
            setPathLabels(optimisticLabels);
            setUiStage("dashboard");
            setRunStatus("error");
          } catch {
            if (!isMountedRef.current) {
              isApiCallRef.current = false;
              return;
            }
            const networkReplay = shouldAttemptClientReplay(simulationOptions?.useCachedOnFailure, null)
              ? resolveReplaySimulationResponse()
              : null;
            if (networkReplay) {
              scheduleReplayDashboard(networkReplay);
              return;
            }
            isApiCallRef.current = false;
            setPathLabels(optimisticLabels);
            setUiStage("dashboard");
            setRunStatus("error");
          }
        })();
      });
    },
    [applySimulationResponse, simulationOptions, activeDemoScenarioId],
  );

  const resetToInput = useCallback(() => {
    setUiStage("input");
    setRunStatus("idle");
    setForm(emptyDecisionFormState);
    setActiveDemoScenarioId(null);
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
                <p className="font-heading text-body font-semibold text-text">Replay / cached results</p>
                <p className="mt-1 text-caption text-text-dim">
                  Showing a saved or bundled simulation — not a live model run. Use this path when the API fails
                  during a demo.
                </p>
                {meta?.cachedReplay ? (
                  <p data-testid="cached-replay-hint" className="mt-2 text-caption text-text-dim">
                    Telemetry flags this view as cached replay (<code className="rounded bg-bg px-1">meta.cachedReplay</code>
                    ).
                  </p>
                ) : null}
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
                  {isDevPreviewEnabled && (
                    <div
                      role="group"
                      aria-label="Demo scenarios (dev-only)"
                      className="mb-6 rounded-xl border border-border bg-surface/60 px-4 py-3"
                    >
                      <p className="text-caption font-medium text-text-dim">Demo inputs</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {DEMO_SCENARIO_ORDER.map((id) => {
                          const label =
                            id === "demo-map-v1" ? "Demo 1: Map" : id === "demo-flow-v1" ? "Demo 2: Flow" : "Demo 3: Network (fallback)";
                          return (
                            <button
                              key={id}
                              type="button"
                              data-testid={`demo-scenario-btn-${id}`}
                              onClick={() => applyDemoScenarioToForm(id)}
                              className="rounded-lg border border-border px-3 py-2 text-caption text-text transition hover:border-accent hover:text-accent"
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {activeDemoScenarioId ? (
                        <p className="mt-2 text-caption text-text-dim" data-testid="demo-scenario-selected">
                          Selected: <span className="font-mono">{activeDemoScenarioId}</span>
                        </p>
                      ) : null}
                    </div>
                  )}

                  {!isDevPreviewEnabled && publicDemoScenarioId && (
                    <div
                      role="group"
                      aria-label="Public demo"
                      className="mb-6 rounded-xl border border-border bg-surface/60 px-4 py-3"
                    >
                      <p className="text-caption font-medium text-text-dim">Public demo</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          data-testid={`public-demo-scenario-btn-${publicDemoScenarioId}`}
                          onClick={() => applyDemoScenarioToForm(publicDemoScenarioId)}
                          className="rounded-lg border border-accent px-3 py-2 text-caption transition hover:border-accent hover:text-accent"
                        >
                          Run:{" "}
                          {publicDemoScenarioId === "demo-map-v1"
                            ? "Demo 1: Map"
                            : publicDemoScenarioId === "demo-flow-v1"
                              ? "Demo 2: Flow"
                              : "Demo 3: Network (fallback)"}
                        </button>
                      </div>
                      {activeDemoScenarioId ? (
                        <p className="mt-2 text-caption text-text-dim" data-testid="demo-scenario-selected">
                          Selected: <span className="font-mono">{activeDemoScenarioId}</span>
                        </p>
                      ) : null}
                    </div>
                  )}
                  <DecisionForm
                    value={form}
                    onChange={(patch) => {
                      setForm((prev) => ({ ...prev, ...patch }));
                      if (activeDemoScenarioId !== null) setActiveDemoScenarioId(null);
                    }}
                    onValidSubmit={onValidSubmit}
                    isSubmitting={runStatus === "submitting"}
                    formFooter={<SimulationFramingBanner />}
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
                            pathData={pathDataA}
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
                                pathData={pathDataA}
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
                          agentsByPath={{ A: pathDataA.agents, B: pathDataB.agents }}
                        />
                      </motion.article>
                    }
                    right={
                      <VizMapSideCanvas side="right" vizType={vizType}>
                        {vizType === "map" ? (
                          <MapHalf
                            viz_type="map"
                            pathData={pathDataB}
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
                                pathData={pathDataB}
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
                      <motion.div {...panelMotion} transition={springTransition} className="h-full">
                        {vizType === "map" ? (
                          <VizMapSideCanvas side="left" vizType={vizType}>
                            <PathSummaryCard
                              pathLabel={pathLabels[0]}
                              pathId="A"
                              accentClass="text-accent"
                              summary={pathDataA.synthesis.summary}
                              footer={
                                <ScoreRing
                                  score={kpiStackProps.kpisA.overallScore}
                                  pathLabel={pathLabels[0]}
                                  pathTone="A"
                                />
                              }
                            />
                          </VizMapSideCanvas>
                        ) : (
                          <VizResultCard
                            pathLabel={pathLabels[0]}
                            pathId="A"
                            accentClass="text-accent"
                            vizType={vizType}
                            pathData={pathDataA}
                            score={kpiStackProps.kpisA.overallScore}
                            agentStates={agentStatesByPath.A}
                            agents={pathDataA.agents}
                          />
                        )}
                      </motion.div>
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
                        <SimulationFramingBanner className="mt-4" isReplay={meta?.cachedReplay === true} />
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
                      <motion.div
                        {...panelMotion}
                        transition={{ ...springTransition, delay: 0.1 }}
                        className="h-full"
                      >
                        {vizType === "map" ? (
                          <VizMapSideCanvas side="right" vizType={vizType}>
                            <PathSummaryCard
                              pathLabel={pathLabels[1]}
                              pathId="B"
                              accentClass="text-blue"
                              summary={pathDataB.synthesis.summary}
                              footer={
                                <ScoreRing
                                  score={kpiStackProps.kpisB.overallScore}
                                  pathLabel={pathLabels[1]}
                                  pathTone="B"
                                />
                              }
                            />
                          </VizMapSideCanvas>
                        ) : (
                          <VizResultCard
                            pathLabel={pathLabels[1]}
                            pathId="B"
                            accentClass="text-blue"
                            vizType={vizType}
                            pathData={pathDataB}
                            score={kpiStackProps.kpisB.overallScore}
                            agentStates={agentStatesByPath.B}
                            agents={pathDataB.agents}
                          />
                        )}
                      </motion.div>
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

function VizResultCard({
  pathLabel,
  pathId,
  accentClass,
  vizType,
  pathData,
  score,
  agentStates,
  agents,
}: {
  pathLabel: string;
  pathId: "A" | "B";
  accentClass: string;
  vizType: VizType;
  pathData: PathData;
  score: number;
  agentStates: AgentState[];
  /** When provided, shows a grounding distribution summary for FR28 (AC1). */
  agents?: AgentOutput[];
}) {
  const groundLine = agents ? summarizeGroundingDistribution(agents, pathLabel) : null;
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className={`shrink-0 font-heading text-h3 ${accentClass}`}>{pathLabel}</h3>
      <p className="shrink-0 text-caption text-text-dim">Path {pathId}</p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <VizRouter
          viz_type={vizType}
          pathData={pathData}
          pathLabel={pathLabel}
          agentStates={agentStates}
        />
      </div>
      {groundLine ? (
        <p className="mt-2 shrink-0 text-caption text-text-dim" data-testid={`viz-result-card-grounding-${pathId}`}>
          {groundLine}
        </p>
      ) : null}
      <div className="mt-4 flex shrink-0 flex-col items-center border-t border-border/50 pt-4">
        <ScoreRing score={score} pathLabel={pathLabel} pathTone={pathId} />
      </div>
    </div>
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

