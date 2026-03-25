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

## Deferred from: code review of 1-4-parallel-integration-contract-ownership-boundaries (2026-03-25)

- Slot mounting guide maps `running` to PanelSlots but `ThinSliceDemo.tsx` mounts via `SimulationShell` props directly. Guide is intentionally conceptual; Epic 5 devs will cross-reference `ThinSliceDemo.tsx` directly.
- `overallWinner` guard test only exercises "B" — no alternate mock for path "A". Regression signal is valid as-is; adding an "A" fixture is Epic 2 scope.
- Contract interfaces (`VizSlotProps` etc.) are orphan types until Epics 3–5 consume them. Intentional by story design.
- Contracts omit loading/error/partial-path lifecycle concerns (e.g. `RunStatus`, `ErrorResponse`). Out of scope for Story 1.4; Epic 2–5 own those shapes.
- `docs/integration-contracts.md` defines no versioning or change-notice process. Process gap; address in a documentation or team-process story.
- AC3 compliance (no "waiting for Epic 6" wording in `epics.md`) not verified within this diff; planning artifact outside the changeset.
- Module-level fixture null-safety not guarded at runtime; TypeScript `satisfies SimulationResponse` provides compile-time coverage — no runtime issue expected.
- Dual public names `MOCK_BAKERY_MAP_FIXTURE` / `MOCK_SIMULATION_RESPONSE` could cause import drift over time. Alias is intentional per spec; consider consolidating in a future cleanup pass.

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
