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
