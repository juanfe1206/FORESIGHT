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

## Deferred from: code review of 2-3-parallel-isolated-agent-execution (2026-03-25)

- Shared `SIMULATION_TIMEOUT_MS` applies to both the classify phase and each of the 8 agent slots; worst-case wall-clock = `timeoutMs + (timeoutMs × ceil(8/concurrency))` (90s at defaults), risking infra gateway timeouts. Address with a separate `AGENT_TIMEOUT_MS` env var in a future story.
- `max_tokens: 220` is tight for JSON output with all required fields plus a meaningful insight sentence; complex responses may truncate mid-JSON producing silent `AgentParseError` slot failures. Revisit token budget in Epic 6 or when tuning agent quality.
- `new OpenAI({ apiKey })` is instantiated inside `runParallelAgents` on every simulation request; no connection reuse or singleton pattern. Extract to a factory or module-level singleton in a future performance pass.

## Deferred from: code review of 2-1-simulate-api-route-scaffold-environment-wiring (2026-03-24)

- Rate limiter `store` in `rate-limit.ts` accumulates Map entries for every unique IP that has ever made a request; old timestamps are evicted but the key is never removed. Memory grows proportionally to the number of unique IPs over the process lifetime. Acceptable for MVP/hackathon; revisit if a persistent rate-limit store (e.g. Redis) is added.
- `x-forwarded-for` header can be forged by a client to rotate through arbitrary IPs and bypass per-IP rate limiting. Known limitation of header-based IP detection without a trusted-proxy layer. Acceptable for MVP; document in security posture notes if the product moves to production.
- `decision` field is validated for non-empty *after trim* but stored in `SimulationRequest.data` untrimmed. Clients can send leading/trailing whitespace that passes validation. Will be fed as-is to LLM prompt construction in Story 2.2+; consider trimming the stored value in Story 2.2 when the field is first used.
