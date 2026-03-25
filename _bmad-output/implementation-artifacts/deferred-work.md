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
