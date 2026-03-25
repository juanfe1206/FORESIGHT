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

## Deferred from: code review of 3-4-flow-view-resource-allocation-visualization (2026-03-25)

- `<defs>` in `OutcomePool.tsx` is nested inside a `<g>` element rather than at the SVG root. Technically valid SVG but inconsistent with Safari's historical handling of `<defs>` inside groups. The `#outcome-fill` gradient should be hoisted into `FlowHalf`'s top-level `<defs>` block alongside `#flow-pipe-gradient`.
- Gradient ids `flow-pipe-gradient` and `outcome-fill` are hard-coded strings shared across both `FlowHalf` SVGs rendered side-by-side. Today the gradients are identical so there is no visual bug, but the second definition silently wins. Apply a per-instance prefix via React 18 `useId()` before the two panels diverge visually.
- `pipeSqueeze` is derived from raw `kpis.competitiveExposure` directly in `FlowHalf` rather than in `flowVizModel`. The divisor `200` is an unnamed magic number. Move into `buildFlowVizModel` (expose as `model.pipeSqueeze`) and add the constant to `FLOW_VIZ_SCALING` so it is unit-tested alongside all other KPI mappings.
- `pathRefs` array literal in `FlowHalf` is recreated each render, invalidating the `useMemo` in `Particles` on every render. Wrap in `useMemo` in `FlowHalf` or accept a fixed-size tuple to make the dependency stable.
- `particleFill` in `Particles.tsx` uses the magic number `145` (HSL hue for green) without a named constant. Extract as `const GREEN_HUE = 145` for readability.

## Deferred from: code review of 3-1-decision-form-context-fields (2026-03-25)

- `inputClassName` Tailwind string is duplicated verbatim in both `ContextFields.tsx` and `DecisionForm.tsx`. No correctness issue; extract to a shared constant (e.g., `src/components/input/styles.ts`) in a future cleanup pass.
- `ContextFields` props `revenueErrorId?: string` and `revenueError?: string | null` are typed as optional but are always intended to be passed together. If only `revenueError` is set without `revenueErrorId`, `aria-describedby` would render as the string `"undefined"` on the DOM. No runtime impact with the current single consumer (`DecisionForm`); tighten to required props or a union type in a future a11y pass.
