# Story 6.4: Demo Scenarios, Script & Pre-Demo Checklist

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a presenter,
I want three canned inputs that each force a different viz mode plus a short script,
So that rehearsal is repeatable under pressure.

## Acceptance Criteria

_trace: FR30; Epic 6 Story 6.4; architecture pre-demo controls + smoke test guidance; PRD demo kit + resilience requirements; UX presenter journey + projection/readability constraints_

1. **Given** demo mode or documented fixtures **when** the team runs Demo 1 / 2 / 3 inputs from the master spec **then** classifier produces `viz_type` values mapping to **map**, **flow**, and **network** respectively, or a documented and acceptable substitute where network intentionally lands on `fallback` with explicit rationale.

2. **And** a demo script document exists in `docs/` or `_bmad-output/` that defines a concise ~60-second narration with ordered beats: problem framing, simulation start, parallel agent visibility, mode adaptation, KPI comparison, one key tradeoff, and close.

3. **And** a pre-demo checklist document exists and includes completion checks for:
   - cached replay path exercised at least once end-to-end,
   - `FallbackViz` exercised in a controlled degraded case,
   - projector/readability contrast spot-check on dark theme surfaces,
   - screenshot backup captured for all three scenarios.

4. **And** script/checklist language preserves Story 6.3 trust framing: outcomes are simulated consequences, not guaranteed forecasts or professional advice.

5. **And** artifacts are testable and maintainable: scenario fixtures and expected mode mapping are represented in a deterministic data shape that can be asserted in tests or CI smoke checks without manual interpretation.

6. **And** `npm run test`, `npm run lint`, and `npm run build` pass.

## Tasks / Subtasks

- [x] **Scenario fixture pack (Map / Flow / Network)** (AC: 1, 5)
  - [x] Create a dedicated demo scenario source (for example `src/lib/demo-scenarios.ts`) with three named scenarios, each containing decision, context, and expected `viz_type`.
  - [x] Reuse existing request contract shape (`SimulationRequest`) and avoid introducing a parallel incompatible schema.
  - [x] Add stable scenario IDs suitable for script/checklist references (for example `demo-map-v1`, `demo-flow-v1`, `demo-network-v1`).

- [x] **Mode-mapping verification** (AC: 1, 5)
  - [x] Add tests that run classifier-facing payloads (or API integration tests where practical) to verify expected mode per scenario.
  - [x] If network is intentionally substituted by fallback for timing/degradation constraints, capture exact condition and expected output in docs plus test expectation.

- [x] **60-second demo script artifact** (AC: 2, 4)
  - [x] Add a script doc (recommended: `docs/demo-script.md`) with numbered 60-second narration beats and optional 30-second compressed variant.
  - [x] Include explicit non-advice/simulation framing line aligned with Story 6.3 copy posture.

- [x] **Pre-demo checklist artifact** (AC: 3, 4)
  - [x] Add checklist doc (recommended: `docs/pre-demo-checklist.md`) with checkbox format and owner/date fields.
  - [x] Include replay, fallback, projector contrast, and screenshot backup checks as mandatory items.
  - [x] Include links/references to scenario IDs and script sections to reduce rehearsal ambiguity.

- [x] **Shell integration affordance (optional but recommended)** (AC: 1, 2, 3)
  - [x] Add a minimal non-invasive way to preload/insert demo scenarios in input flow (dev/demo-only toggle, helper buttons, or documented copy-paste blocks), without changing core user flow for production.
  - [x] Keep this behind explicit demo intent; do not weaken existing validation or state-machine behavior.

- [x] **Quality gates** (AC: 6)
  - [x] Run `npm run test`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run build`.

### Review Findings

- [x] [Review][Patch] "Rehearsal intent:" prefix in scenario `details` leaks into AI agent prompts [`src/lib/demo-scenarios.ts`] — Fixed: replaced with clean user-facing context descriptions.
- [x] [Review][Patch] Missing component-level test for Demo 3 fallback replay path [`src/components/shell/ThinSliceDemo.test.tsx`] — Fixed: added test asserting `runStatus=fallback`, `vizType=fallback`, and `fallback-shell` present after 504 response with cache replay.
- [x] [Review][Patch] Pre-demo checklist uses plain text for script reference [`docs/pre-demo-checklist.md`] — Fixed: changed to `[demo-script.md](./demo-script.md)`.
- [x] [Review][Defer] Circular `derivePathLabels` assertion in demo classifier test [`src/lib/classifier.test.ts`] — deferred, pre-existing pattern concern (test imports and calls `derivePathLabels` to compute expected labels, same function the classifier calls; assertion verifies no regression only if `derivePathLabels` itself is correct)
- [x] [Review][Defer] `expectedVizType` field meaning undocumented for Demo 3 [`src/lib/demo-scenarios.ts`] — deferred, pre-existing; field correctly represents classifier output ("network") but Demo 3's visible UI outcome is "fallback"; no comment bridges the gap for future maintainers

## Dev Notes

### Intent

Story 6.4 is a delivery-hardening story, not a new product capability. The goal is repeatable demo execution under pressure while preserving the honesty and resilience behavior established in 6.2/6.3.

### Architecture compliance (must follow)

- Preserve canonical request/response contracts (`SimulationRequest`, `SimulationResponse`) and backend-owned `viz_type` routing decision.
- Keep replay/fallback as first-class success paths (ADR-05), not hidden exceptions.
- Follow architecture build controls and smoke expectations: one canned scenario per viz mode plus pre-demo checklist.
- Keep cache/replay handling client-local and bounded; do not add server persistence for demo fixtures.

### File structure and implementation guardrails

- Preferred locations:
  - Scenario source: `src/lib/` (typed data, reusable by tests/docs).
  - Script/checklist docs: `docs/`.
  - Story artifact updates: `_bmad-output/implementation-artifacts/`.
- Do not duplicate existing fixture/contract definitions; extend existing typed modules where possible.
- Avoid adding runtime dependencies for this story; scope is data/docs/tests and light UX wiring only.

### Testing requirements

- Add deterministic tests for scenario-to-mode expectations (unit or route-level integration depending on test ergonomics).
- Preserve existing test style (Vitest + Testing Library for UI surfaces).
- Validate that replay/fallback rehearsal checks can be executed without network assumptions (golden/cached path available).

### Previous story intelligence (from 6.3)

- Keep trust copy consistent with FR29 and replay honesty from 6.2; avoid contradictory messaging across banners and docs.
- Continue non-color-only communication patterns for critical state/trust cues.
- Reuse current dashboard/shell placement patterns instead of introducing new disconnected trust messaging zones.
- Preserve integration-contract alignment; do not drift documentation from actual component/data usage.

### Git intelligence (recent commits)

- Recent sequence (`6.1` -> `6.2` -> `6.3`) converged on integration stability, replay resilience, and trust framing.
- Follow the same implementation style: small typed modules, explicit tests, and story/status artifact updates.

### Latest technical notes

- Next.js 16 upgrade guidance emphasizes current runtime/tooling constraints and App Router migration cautions; keep changes framework-neutral and avoid touching infra unless required.
- Current test ecosystem supports deterministic tagging/hook patterns in newer Vitest releases; no version bump is required for this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Error Handling/Cache Strategy, Build/Release Controls, ADR-05]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR30, demo kit requirements, resilience/readability risks]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Presenter 60-second flow, fallback/replay continuity, projection/readability]
- [Source: `_bmad-output/implementation-artifacts/6-3-transparency-confidence-non-advice-framing.md` — trust framing and implementation patterns]

## Dev Agent Record

### Agent Model Used

GPT-5.3 (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented deterministic demo scenario fixtures in `src/lib/demo-scenarios.ts` (stable IDs + typed context) with `src/lib/demo-scenarios.test.ts`.
- Extended `src/lib/classifier.ts` to support demo-only deterministic mapping via `options.demoScenarioId` (bypasses OpenAI for known scenario IDs).
- Updated `/api/simulate` (`src/app/api/simulate/route.ts`) to pass through `demoScenarioId` and to force a controlled `ProviderTimeoutError` for Demo 3 (`demo-network-v1`) in non-production so the shell can exercise `FallbackViz` via cache/golden replay.
- Added rehearsal artifacts: `docs/demo-script.md` (~60-second ordered beats + non-advice framing) and `docs/pre-demo-checklist.md` (cached replay, `FallbackViz`, projector readability, screenshot backup checks).
- Wired dev-only input-flow demo buttons in `src/components/shell/ThinSliceDemo.tsx` to preload Demo 1/2/3 and to send `options.demoScenarioId` on submit; when replay triggers fallback, UI sets `vizType` to `fallback` for consistent HUD + side-panel semantics.
- Updated/added tests for all new behaviors: `src/lib/classifier.test.ts`, `src/app/api/simulate/route.test.ts`, and `src/components/shell/ThinSliceDemo.test.tsx`. Verified `npm run test`, `npm run lint`, and `npm run build` pass.

### File List

- `_bmad-output/implementation-artifacts/6-4-demo-scenarios-script-pre-demo-checklist.md`
- `src/lib/demo-scenarios.ts`
- `src/lib/demo-scenarios.test.ts`
- `src/lib/classifier.ts`
- `src/lib/classifier.test.ts`
- `src/app/api/simulate/route.ts`
- `src/app/api/simulate/route.test.ts`
- `docs/demo-script.md`
- `docs/pre-demo-checklist.md`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-03-25: Story 6.4 implemented — deterministic demo scenarios + classifier mapping, controlled Demo 3 network fallback rehearsal, and added demo script + pre-demo checklist artifacts; status → review.

---

**Story completion status:** review - demo scenarios + script/checklist + deterministic mapping implemented and validated.
