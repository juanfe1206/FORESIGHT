# Cross-epic integration contracts

Living reference for parallel work on Epics 2–5. Source-of-truth types live in `src/lib/types.ts` and slot wrappers in `src/components/shell/PanelSlots.tsx`.

## Contract table

| Contract ID | Owner epic | Source file | TypeScript interface | Mock constant | Mock fallback behavior | Verification |
|-------------|------------|-------------|----------------------|---------------|------------------------|--------------|
| C1 — Viz slot | Epic 3 (FlowView), Epic 4 (MapView), Epic 5 (NetworkView, FallbackViz) | `src/lib/integration-contracts.ts` | `VizSlotProps` | `MOCK_VIZ_SLOT_PROPS_A` | Path A bakery-map props (`viz_type: "map"`, path A data, label "Invest in Instagram ads"). Use to render any viz component without a live simulation. | `npm run test -- src/lib/integration-contracts.test.ts` |
| C2 — AgentHUD center | Epic 5 | `src/lib/integration-contracts.ts` | `AgentHudSlotProps` | `MOCK_AGENT_HUD_PROPS` | Dual-path agent animation: `agentStatesByPath` (A/B, four `"dormant"` each), `pathLabels`, `viz_type`, and `roles` from `MOCK_BAKERY_MAP_FIXTURE`. Optional `insightsByPath`. Use for HUD layout and animation development without a live simulation. | `npm run test -- src/lib/integration-contracts.test.ts` |
| C3 — KPI stack center | Epic 5 | `src/lib/integration-contracts.ts` | `KpiStackSlotProps` | `MOCK_KPI_STACK_PROPS` | Both path KPIs, comparison, and path labels from the bakery scenario. UI: `KpiStack` in `src/components/dashboard/KpiStack.tsx` (thin slice: `ThinSliceDemo` center column). | `npm run test -- src/lib/integration-contracts.test.ts` |
| C4 — ScoreRing side | Epic 5 | `src/lib/integration-contracts.ts` | `ScoreRingSlotProps` | `MOCK_SCORE_RING_PROPS_A` | Path A overall score (67) and label. Use for ScoreRing development with a stable numeric value. | `npm run test -- src/lib/integration-contracts.test.ts` |
| C5 — DeepDivePanel center | Epic 4 | `src/lib/integration-contracts.ts` | `DeepDivePanelSlotProps` | `MOCK_DEEP_DIVE_PROPS` | Full path A + B data and labels from the bakery scenario. Use for DeepDivePanel tab/narrative development without a merged API response. | `npm run test -- src/lib/integration-contracts.test.ts` |
| C6 — Simulation API | Epic 2 (producer), Epics 3–5 (consumers) | `src/lib/types.ts` | `SimulationResponse` | `MOCK_BAKERY_MAP_FIXTURE` / `MOCK_SIMULATION_RESPONSE` in `src/lib/mock-fixture.ts` | Complete bakery-map simulation response (both paths, all KPIs, comparison). Epic 2 must return a response satisfying `SimulationResponse`; Epics 3–5 consume it read-only. | `npm run test` (includes `types.test.ts`, `mock-fixture.test.ts`, `integration-contracts.test.ts`) |

### C6 — API contract detail

- **Source of truth:** `src/lib/types.ts` (`SimulationResponse` and related types).
- **Mock fallback:** `MOCK_BAKERY_MAP_FIXTURE` (alias for the same object as `MOCK_SIMULATION_RESPONSE`) in `src/lib/mock-fixture.ts` — full bakery map scenario with both paths, KPIs, and comparison.

## No-Epic-6 guarantee

Every contract above can be verified locally without live API keys, streaming, or Epic 6 client integration:

- UI slot contracts (C1, C3–C5) use typed props plus mocks derived from `MOCK_BAKERY_MAP_FIXTURE`. `MOCK_AGENT_HUD_PROPS` (C2) uses the same fixture for labels and roles, with all agents dormant for the initial HUD layout.
- The API contract is satisfied by the shared types and the same fixture data.

No story in Epics 2–5 should block on “waiting for Epic 6” for contract completeness; Epic 6 adds production wiring, not the shapes defined here.

## Slot mounting guide

Panel regions come from `PanelSlots.tsx` (`LeftPanelSlot`, `CenterPanelSlot`, `RightPanelSlot`). Which epic mounts where depends on `uiStage` from `useUiShell()`:

| `uiStage` | Left (`LeftPanelSlot`) | Center (`CenterPanelSlot`) | Right (`RightPanelSlot`) |
|-----------|-------------------------|----------------------------|---------------------------|
| `running` | Viz path A (Epic 3/4/5) | AgentHUD (Epic 5) | Viz path B (Epic 3/4/5) |
| `dashboard` | Path A summary + ScoreRing (Epic 5) | KPI stack + winner + CTA (Epic 5) | Path B summary + ScoreRing (Epic 5) |
| `deepDive` | Compressed path A + mini viz (Epic 4) | DeepDivePanel (Epic 4) | Compressed path B + mini viz (Epic 4) |
| `input` | Not used (Epic 3: full-width form elsewhere) | Not used | Not used |

Shell state access: `import { useUiShell } from "@/lib/ui-shell-context"`.
