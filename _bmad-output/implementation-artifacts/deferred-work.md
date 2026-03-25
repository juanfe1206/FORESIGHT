# Deferred Work

## Deferred from: code review of 1-1-thin-slice-scaffold-user-visible-first-run (2026-03-24)

- `globals: true` in `vitest.config.ts` is redundant because all test files already import `describe`, `it`, `expect` explicitly from `"vitest"`. One or the other should be the source of truth. Pre-existing pattern choice, not introduced by Story 1.1.
- `fireEvent` + `userEvent` are mixed in the same integration test (`ThinSliceDemo.test.tsx`). The explicit `userEvent.setup()` is used only for the button click while the textarea uses `fireEvent.change`. This is an intentional workaround documented in the Dev Agent Record debug log (Framer Motion + fake timers conflict). Consider revisiting when Framer Motion timer handling is stabilized.

## Deferred from: code review of 1-2-typescript-domain-types-mock-data-fixture (2026-03-24)

- Story status metadata is inconsistent between `_bmad-output/implementation-artifacts/1-1-thin-slice-scaffold-user-visible-first-run.md` and current sprint tracking state. This appears to be pre-existing process drift and is not required to complete Story 1.2 acceptance criteria.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` has mismatched timestamp fields (header comment `last_updated` vs YAML `last_updated`). Treat as pre-existing tracking hygiene work, not a Story 1.2 blocker.

## Deferred from: code review of 1-3-application-state-machine-slot-ownership (2026-03-25)

- Multiple slot instances (`LeftPanelSlot` etc.) share hardcoded `data-testid` strings across stages. Tests already use `getAllByTestId`, so no current failure. Consider adding a `testIdPrefix` prop if E2E tooling requires unique selectors.
- Dashboard `centerPanel` placeholder shows generic "Comparison" heading; spec slot contract specifies "KPI stack + winner cues". Skeletal content explicitly permitted in Story 1.3; full wiring deferred to Epic 3/4/5.
- Route module (`page.tsx`) re-exports library types — couples a route file to `@/lib/ui-state` contract. Intentional per completion notes; revisit if circular import issues arise.
- `vi.stubEnv("NODE_ENV", "production")` in tests may not faithfully reflect Next.js build-time `NODE_ENV` inlining. Not a regression from Story 1.3; revisit when running full integration test pass.
- `role="region"` landmark spam from nested slot wrappers (three landmarks per shell stage). Accessibility design decision; consider using `aria-hidden` on purely decorative slot boundaries, or a single landmark per stage, in a future a11y pass.
- `ui-state.ts` omits optional reducer/event scaffolding noted in File Structure Guidance. Explicitly optional in spec; add when state complexity warrants it.
- Error/fallback shells animate in/out inconsistently (outside `AnimatePresence`). Aesthetic only; no AC requires animation for skeletal error/fallback shells.

## Deferred from: code review of 4-1-mode-badge-map-shell-integration (2026-03-24)

- `VIZ_TYPES` runtime array in `ui-state.ts` duplicates the `VizType` union literals — drift risk if union extends; single authoritative source preferred.
- `onSubmit` hardcodes `MOCK_BAKERY_MAP_FIXTURE.viz_type` without `isVizType` guard — typed TypeScript covers it now; guard warranted when real API response replaces the fixture in Epic 6.
- Default context no-op setters for `setVizType` — silent failure when consuming outside a Provider; consider a dev-mode invariant or warning.
- Tests don't assert `VizOrientationBand` presence in `dashboard` / `deepDive` stages — AC5 minimally satisfied; coverage gap is not a regression.
- `page.tsx` re-exports `isVizType` / `VizType` from route module — widens public surface of a page entry point; revisit if import confusion arises.
- `aria-live="polite"` on `ModeBadge` with `role="status"` — may generate noisy SR announcements if multiple badge instances appear in one render cycle; audit in a11y pass.
- `VizMapSideCanvas` returns bare fragment for non-map modes — no reserved region; side-panel height jumps on viz switch. Intentional per AC3 scope (map-only); revisit in Epic 3/5 VizRouter work.
- Dev `vizType` `<select>` options in `ThinSliceDemo` are hard-coded separately from `VIZ_TYPES` constant — could drift from the union; consolidate in a cleanup pass.

## Deferred from: code review of 1-4-parallel-integration-contract-ownership-boundaries (2026-03-25)

- Slot mounting guide maps `running` to PanelSlots but `ThinSliceDemo.tsx` mounts via `SimulationShell` props directly. Guide is intentionally conceptual; Epic 5 devs will cross-reference `ThinSliceDemo.tsx` directly.
- `overallWinner` guard test only exercises "B" — no alternate mock for path "A". Regression signal is valid as-is; adding an "A" fixture is Epic 2 scope.
- Contract interfaces (`VizSlotProps` etc.) are orphan types until Epics 3–5 consume them. Intentional by story design.
- Contracts omit loading/error/partial-path lifecycle concerns (e.g. `RunStatus`, `ErrorResponse`). Out of scope for Story 1.4; Epic 2–5 own those shapes.
- `docs/integration-contracts.md` defines no versioning or change-notice process. Process gap; address in a documentation or team-process story.
- AC3 compliance (no "waiting for Epic 6" wording in `epics.md`) not verified within this diff; planning artifact outside the changeset.
- Module-level fixture null-safety not guarded at runtime; TypeScript `satisfies SimulationResponse` provides compile-time coverage — no runtime issue expected.
- Dual public names `MOCK_BAKERY_MAP_FIXTURE` / `MOCK_SIMULATION_RESPONSE` could cause import drift over time. Alias is intentional per spec; consider consolidating in a future cleanup pass.

## Deferred from: code review of 3-4-flow-view-resource-allocation-visualization (2026-03-25)

- `<defs>` in `OutcomePool.tsx` is nested inside a `<g>` element rather than at the SVG root. Technically valid SVG but inconsistent with Safari's historical handling of `<defs>` inside groups. The `#outcome-fill` gradient should be hoisted into `FlowHalf`'s top-level `<defs>` block alongside `#flow-pipe-gradient`.
- Gradient ids `flow-pipe-gradient` and `outcome-fill` are hard-coded strings shared across both `FlowHalf` SVGs rendered side-by-side. Today the gradients are identical so there is no visual bug, but the second definition silently wins. Apply a per-instance prefix via React 18 `useId()` before the two panels diverge visually.
- `pipeSqueeze` is derived from raw `kpis.competitiveExposure` directly in `FlowHalf` rather than in `flowVizModel`. The divisor `200` is an unnamed magic number. Move into `buildFlowVizModel` (expose as `model.pipeSqueeze`) and add the constant to `FLOW_VIZ_SCALING` so it is unit-tested alongside all other KPI mappings.
- `pathRefs` array literal in `FlowHalf` is recreated each render, invalidating the `useMemo` in `Particles` on every render. Wrap in `useMemo` in `FlowHalf` or accept a fixed-size tuple to make the dependency stable.
- `particleFill` in `Particles.tsx` uses the magic number `145` (HSL hue for green) without a named constant. Extract as `const GREEN_HUE = 145` for readability.

## Deferred from: code review of 3-1-decision-form-context-fields (2026-03-25)

- `inputClassName` Tailwind string is duplicated verbatim in both `ContextFields.tsx` and `DecisionForm.tsx`. No correctness issue; extract to a shared constant (e.g., `src/components/input/styles.ts`) in a future cleanup pass.
- `ContextFields` props `revenueErrorId?: string` and `revenueError?: string | null` are typed as optional but are always intended to be passed together. If only `revenueError` is set without `revenueErrorId`, `aria-describedby` would render as the string `"undefined"` on the DOM. No runtime impact with the current single consumer (`DecisionForm`); tighten to required props or a union type in a future a11y pass.

## Deferred from: code review of 3-2-simulate-cta-submit-wiring (2026-03-25)

- `focus-visible` ring on `GlowButton` uses full `ring-accent` + `ring-offset-2 ring-offset-bg` while `DecisionForm` inputs use `ring-accent/30` with no offset. The deviation is defensible (ring-offset needed for visibility on `bg-accent` background), but the spec says "consistent with DecisionForm inputs." Revisit in a dedicated a11y/design-token pass.
- `onValidSubmit` microtask in `ThinSliceDemo` does not re-check that `runStatus` is still `"submitting"` before advancing to `inProgress`. In production the window is sub-millisecond and no concurrent actor can change state. In the dev preview panel, a user could theoretically change `runStatus` via the dev select in that gap and get overwritten. Low risk; consider a guard if dev UX issues are reported.

## Deferred from: code review of 3-3-simulation-container-panel-headers-input-running-transition (2026-03-25)

- Choreography total duration is ~1.69s with `AnimatePresence mode="wait"` (input exit 0.45s + panel tail 1.24s). Spec §10.1 / UX-DR15 targets "~1.2s total perceived sequence." Treat as soft guideline for this sprint; address in a dedicated motion polish pass (overlap stages with `mode="sync"` or reduce individual durations).
- Panel stagger order is left→right (delays 0, 0.07, 0.14s). Spec task implies center-out ("expand from center / stagger children"). Left-to-right reading order is defensible; revisit stagger direction with design in a UX polish pass.
- No integration tests for `SimulationContainer` (aria-labels, stagger, VizRouter wiring); pre-existing gap in shell test coverage.
- `derivePathLabels` lacks unit tests for the `vs`-pattern branch, multi-pipe inputs, 48-char truncation, and 3+-alternative decisions; add a dedicated `derive-path-labels.test.ts` in a future test-coverage pass.
- `isVizType` array in `ThinSliceDemo` duplicates the `VizType` union — adding a new type variant without updating the array silently drops the option from the dev select; consider deriving the array from the type or moving it to `types.ts`.
- `ThinSliceDemo.test.tsx` new test covers pipe-pattern label derivation only; no assertion for the `vs`-pattern path; add a parallel test for "X vs Y" decision inputs.
- `MOCK_BAKERY_MAP_FIXTURE` is passed as `pathDataA`/`pathDataB` for all `viz_type` branches in dev preview — map-specific shape works but may mislead shape assumptions when non-map visualizations land in Epic 4/5.
- `PanelHeader` renders a blank `<header>` region (with reserved min-height) if `title=""` is passed; add a defensive fallback or document that empty-string title is a caller contract violation.
- `PanelHeader` `accentClassName` and `headingLevel` props have no test coverage; add assertions for correct element type and applied class in a future component contract pass.

## Deferred from: code review of 2-1-simulate-api-route-scaffold-environment-wiring (2026-03-24)

- Rate limiter `store` in `rate-limit.ts` accumulates Map entries for every unique IP that has ever made a request; old timestamps are evicted but the key is never removed. Memory grows proportionally to the number of unique IPs over the process lifetime. Acceptable for MVP/hackathon; revisit if a persistent rate-limit store (e.g. Redis) is added.
- `x-forwarded-for` header can be forged by a client to rotate through arbitrary IPs and bypass per-IP rate limiting. Known limitation of header-based IP detection without a trusted-proxy layer. Acceptable for MVP; document in security posture notes if the product moves to production.
- `decision` field is validated for non-empty *after trim* but stored in `SimulationRequest.data` untrimmed. Clients can send leading/trailing whitespace that passes validation. Will be fed as-is to LLM prompt construction in Story 2.2+; consider trimming the stored value in Story 2.2 when the field is first used.

## Deferred from: code review of 2-3-parallel-isolated-agent-execution (2026-03-25)

- Shared `SIMULATION_TIMEOUT_MS` applies to both the classify phase and each of the 8 agent slots; worst-case wall-clock = `timeoutMs + (timeoutMs × ceil(8/concurrency))` (90s at defaults), risking infra gateway timeouts. Address with a separate `AGENT_TIMEOUT_MS` env var in a future story.
- `max_tokens: 220` is tight for JSON output with all required fields plus a meaningful insight sentence; complex responses may truncate mid-JSON producing silent `AgentParseError` slot failures. Revisit token budget in Epic 6 or when tuning agent quality.
- `new OpenAI({ apiKey })` is instantiated inside `runParallelAgents` on every simulation request; no connection reuse or singleton pattern. Extract to a factory or module-level singleton in a future performance pass.

## Deferred from: code review of 2-4-per-path-synthesis-kpi-assembly-telemetry (2026-03-25)

- `max_tokens: 500` hardcoded in `synthesizePath` — timeline with 6 verbose entries plus summary and KPIs could approach or exceed 500 tokens, causing truncated JSON → `SynthesisParseError` → 502. Errors are handled, but the token budget may be too tight for complex scenarios. Revisit in Epic 6 quality/tuning pass.
- Hardcoded constant `8` for agent LLM calls in telemetry math (`route.ts` llmCalls assembly) — silently wrong if agent slot count ever changes. Consider deriving from `agentRun.agentsByPath.A.length + agentRun.agentsByPath.B.length`.
- `progress` field in the live response is fully sourced from `MOCK_SIMULATION_RESPONSE` — agent_states always `["complete","complete","complete","complete"]` and `agents_per_path: 4` from fixture. Correct for a completed run but mock data leaking into production payload. Proper assembly deferred to Epic 6 streaming/progress story.
- Unnecessary spread of `MOCK_SIMULATION_RESPONSE.paths.{A,B}` when building the live response — all three `PathData` fields (`agents`, `synthesis`, `kpis`) are explicitly overridden, making the spread dead weight. Consider removing the spread if `PathData` is confirmed to have no additional fields.

## Deferred from: code review of 4-2-map-view-geographic-simulation-split-screen (2026-03-25)

- Dashboard strip does not mount `MapHalf` (AC1 parenthetical). Explicitly deferred to Epic 5 per story scope notes; dashboard VizMapSideCanvas children are KPI cards until Epic 5.
- `mapbox-gl` CSS imported in root layout ships Mapbox styles to every route. Next.js App Router limitation; story-specified import location per dev notes.
- No explicit empty-token UX guard in `MapScene`. Error boundary catches Mapbox init failure gracefully; first-class empty-config UX deferred.
- Customer dot positions are nondeterministic (unseeded `Math.random()`). Visual QA concern; MVP acceptable per story scope — geographic accuracy is explicitly out of scope.
- `CashFlowTicker` is not an ARIA live region. Accessibility enhancement; not in story scope for MVP.
- Test quality: timing-heavy assertions and mock coverage illusion. jsdom cannot run WebGL; mocking strategy is explicitly documented in story dev notes.
- Hardcoded `€` and `/mo` currency/unit strings in `CashFlowTicker`. i18n not in MVP scope.
- Fixed Madrid `CENTER` for both paths. Explicitly documented MVP limitation; path-specific geocoding is future work.
- `MapErrorBoundary` has no retry or recovery path. Retry is Epic 6 / NFR-I1 territory per story notes.
- `queueMicrotask` state updates may run after unmount during animation cleanup. React 18+ no-throw; low risk in practice.
- `MapFallback` loading placeholder has `aria-hidden` hiding "Loading map…" from screen readers. Accessibility enhancement; not in story scope.
- Redundant explicit `viz_type="map"` prop inside `vizType === "map"` branch in `ThinSliceDemo`. Style concern, not a logic bug; VizSlotProps requires the field.

## Deferred from: code review of 4-3-deep-dive-panel-path-tabs-narrative-with-attribution (2026-03-25)

- Fixed element IDs in `PathTabs` (`tab-path-a`, `panel-path-a`, etc.) break ARIA if more than one PathTabs mounts in a page. Low risk for current single-use, but non-unique IDs are technically invalid HTML.
- Home/End keyboard navigation not handled in `PathTabs`. ARIA authoring practices recommend these keys for first/last tab; only ArrowLeft/ArrowRight are required by AC4.
- No null guard on `AGENT_ROLES[viz_type]` in `getDriverSlotIndex` — TypeScript `VizType` union enforces valid keys at compile time; runtime risk only if types are violated.
- No null guard on `driver` before `toLowerCase()` call — `drivers: string[]` type enforces non-null; runtime risk only if types are violated.
- `DeepDiveStrip` applies both manual 120-char truncation and `line-clamp-4` — double truncation can interact awkwardly but is functionally belt-and-suspenders.
- Score display hardcodes `"/ 100"` without clamping or validation — acceptable for mock phase; real integration should validate score range.
- `expect(() => render()).not.toThrow()` is a weak test guard — many React failures surface as console errors rather than thrown exceptions.
- `MOCK_DEEP_DIVE_PROPS` hardwired in `ThinSliceDemo` — no boundary between demo scaffolding and future real prop integration; intentional for this mock phase story.
- No test for empty or missing `synthesis.timeline` — contract-compliant mock is always non-empty; real data edge case testing deferred to integration story.
- Integration test in `ThinSliceDemo.test.tsx` relies on dev-only stage select control — dev tooling is by design for the thin slice demo.
- `SLOT_BG` only covers indices 0–3; a `viz_type` with more than 4 agent roles would silently fall back to `bg-text-dim`.
- Attribution dots use HTML `title` only — not reliably announced by all screen readers, but is within AC5 spec. Consider `aria-label` per dot in a future accessibility pass.

## Deferred from: code review of 5-1-agent-hud-agent-nodes (2026-03-25)

- `viz_type` accepted by `AgentHudSlotProps` but intentionally discarded inside `AgentHUD` (`void _vizType`). Epic 5 network/fallback views may differentiate layout by viz type; address when those stories are implemented.
- `pathsAllComplete` hard-codes `length === 4` guard. Will silently never trigger KPI preview if array length drifts; enforce contract at the call site or add a runtime assertion when path counts generalise.
- No CSS glow/shadow on the thinking-state animation (UX-DR24 specifies pulse/glow). Pulse (opacity+scale) is implemented; glow is a visual polish item for a future a11y/UX refinement pass.
- `aria-live="polite"` + `aria-atomic="false"` with long concatenated announcement string may be verbose for AT users. Acceptable at MVP; consider per-change atomic snippets in a dedicated a11y pass.
- 24 `setTimeout` + functional `setAgentStatesByPath` updates fire during the mock run. Performance acceptable at this component density; profile and batch if jank is observed on low-end hardware.
- `AgentNode` default switch branches return raw state string / null icon for unknown `AgentState` values. TypeScript union prevents this in practice; add exhaustiveness assertion (`assertNever`) if the union expands.

## Deferred from: code review of 5-2-kpi-comparison-stack-supporting-primitives (2026-03-25)

- `CountUpNumber` initial "0%" flash on first frame — inherent to count-from-zero design; not a defect. Revisit if product feedback indicates visible jank on slow hardware.
- `CountUpNumber` no internal NaN guard — guarded at all callsites via `Number.isFinite`; internal defensive guard worth adding if the component is reused outside KPICard in future.
- `line-clamp-5` silently truncates long narrative KPIs in `KPICard` — acceptable with current fixture data; revisit when real API `opportunityCost` strings arrive to assess actual line lengths.

## Deferred from: code review of 5-3-score-rings-simulation-dashboard-transition (2026-03-25)

- Choreography constants (`KPI_STACK_ROW_COUNT`, `KPI_COUNT_UP_DURATION_S`, `WINNER_BADGE_DELAY_S`) in `dashboard-choreography.ts` manually duplicate values from KpiStack row defs, CountUpNumber default, and WinnerBadge — no compile-time enforcement; silent drift risk if any source changes.
- `CountUpNumber` has no guard for non-finite `value` prop (NaN → renders "NaN") — pre-existing; ScoreRing's `clampOverallScore` prevents exposure in this story's path. Add internal guard when reuse expands.
- `progressbar` `aria-valuenow` announces final score from first render while count-up animates — acceptable ARIA progressbar pattern; the arc animation visually indicates progress. Low user impact.
- SSR/hydration risk from `useReducedMotionConfig` in "use client" components — pre-existing pattern project-wide; App Router "use client" directive constrains to client rendering.
- `cx` variable used for both cx and cy SVG attributes in ScoreRing — misleading for non-square viewBox cases; not a correctness bug with current square layout.
- Test timing assertions in `ScoreRing.test.tsx` are loose (no minimum delay check, some reduced-motion coverage is redundant) — acceptable for current MVP test coverage level.

## Deferred from: code review of 5-4-network-view-fallback-visualization (2026-03-25)

- Hub label text (8px) inside scaling `motion.g` in `NetworkView` may appear blurry on sub-retina displays — visual preference, not a spec violation; revisit in a UX polish pass.
- `VizRenderErrorBoundary` `key` reset on `pathLabel`/`viz_type` change causes full animation entry replay in dev preview — intentional boundary reset design; acceptable at MVP.
- `runCardClassLeft`/`runCardClassRight` extended via Tailwind string concatenation in `ThinSliceDemo` — class conflict risk if base class strings evolve; pre-existing project composition pattern, revisit if `cn()` utility is adopted project-wide.
