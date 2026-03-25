# Story 3.2: Simulate CTA & Submit Wiring

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want one obvious button to start my paired-path simulation,
so that I am not unsure what to do next.

## Acceptance Criteria

_trace: FR3, UX-DR4 (GlowButton affordances), UX-DR22 (submit perceived response & transition); `UiRunStatus` / `UiStage` in `src/lib/ui-state.ts`; architecture §3 Feature Components_

1. **Given** valid form input (same rules as Story 3.1 — non-empty trimmed decision, valid optional revenue) **when** the user activates the primary CTA **then** the primary control is a **`GlowButton`** with visible label **“Simulate My Decision”**, **accent** styling, **hover glow** (not color-only feedback), **minimum height 40px**, and a **loading** state whose **layout width does not collapse or jump** when loading turns on (FR3, UX-DR4).
2. **And** **within ~300ms** of a successful submit activation, the user **perceives** movement toward the **running** experience (e.g. CTA enters **loading** and/or the **input→running** transition begins) — align with UX-DR22; use Framer Motion already on the input region where helpful.
3. **And** `runStatus` follows **`submitting` → `inProgress`** (see sequencing below); **`uiStage`** moves to **`running`** when leaving the input shell (still **no** `POST /api/simulate` in this story — mock path in `ThinSliceDemo` remains).
4. **Given** invalid input **when** the user clicks the CTA **then** the button **does not** enter **loading**; **inline validation** from Story 3.1 still applies (`role="alert"` / field errors); `onValidSubmit` is **not** invoked.

## Tasks / Subtasks

- [ ] **GlowButton component (AC 1)**  
  - [ ] Add `src/components/shared/GlowButton.tsx` (client component as needed) with props at minimum: `children` (label), `loading` (boolean), `disabled`, native `type` (`"submit"` | `"button"`), and spread safe native button props (`className` merge, `aria-busy` when loading).  
  - [ ] Visuals: accent fill using design tokens (`bg-accent`, `text-bg` or equivalent), **hover** glow via `box-shadow` (and/or ring) with a **smooth** transition (~1–1.5s on glow is acceptable per UX-DR4 — avoid seizure-fast flashing). **min-h** ≥ `40px` (e.g. `min-h-10`).  
  - [ ] **Loading:** preserve width (e.g. fixed `min-w` for the default label string, or inline flex with reserved space); show a **visible** busy indicator (spinner or “Working…” with `aria-busy={true}`).  
  - [ ] **Focus:** `focus-visible` ring consistent with `DecisionForm` inputs (see existing `focus-visible:ring-accent` patterns).

- [ ] **DecisionForm: swap CTA (AC 1, 4)**  
  - [ ] Replace the plain `<button type="submit">` in `src/components/input/DecisionForm.tsx` with **`GlowButton`**.  
  - [ ] Add prop e.g. **`isSubmitting: boolean`** (default `false`) — when `true`, CTA is in **loading** and **`disabled`** to prevent double submit; when validation fails, **`isSubmitting` stays false** (AC 4).  
  - [ ] Keep **`data-testid="simulate-submit"`** on the control for existing tests (put on `GlowButton` root element).

- [ ] **ThinSliceDemo: submit sequencing (AC 2, 3)**  
  - [ ] Pass **`isSubmitting={runStatus === "submitting"}`** into `DecisionForm` while `uiStage === "input"`.  
  - [ ] On **valid** `onValidSubmit`, **first** set `runStatus` to **`"submitting"`** while **`uiStage` remains `"input"`** for at least one frame so the **GlowButton can show loading**; **then** schedule transition to **`uiStage: "running"`** and **`runStatus: "inProgress"`** in a **`queueMicrotask`** (or `requestAnimationFrame` once) — preserve existing **mounted guard** (`isMountedRef`) before async updates.  
  - [ ] Keep **`derivePathLabels`**, mock **`RUN_MOCK_MS`** completion, and **bidirectional** dev `runStatus` / `uiStage` reconciliation consistent with Story 1.3 patterns.  
  - [ ] Re-run and adjust **`ThinSliceDemo`** tests if assertions assumed synchronous `uiStage === "running"` with `runStatus === "submitting"` (root should still expose **`data-run-status="submitting"`** immediately after click in the synchronous `act` block).

- [ ] **Tests (AC 1–4)**  
  - [ ] Extend **`DecisionForm.test.tsx`**: invalid submit → CTA not in loading/disabled-from-submitting state (may require querying `aria-busy` or absence of loading UI).  
  - [ ] Add **`GlowButton.test.tsx`** (optional but preferred) for width-stable loading and `aria-busy`.  
  - [ ] Update **`ThinSliceDemo.test.tsx`** if stage/ordering assertions need to match new **`submitting`-while-input** behavior.

- [ ] **Quality gates**  
  - [ ] `npm run lint`, `npm run test`, `npm run build`.

## Dev Notes

### Intent and scope

- This story **implements the branded CTA** and **tightens submit ↔ run lifecycle** wiring. It does **not** add **`POST /api/simulate`** (Epic 2) or **SimulationContainer** choreography (Story 3.3).  
- Story **3.1** delivered **`DecisionForm`** / **`ContextFields`** and validation; **3.2** owns **GlowButton** + **submit UX** called out in 3.1 dev notes.

### Brownfield — current code

- **Submit handler:** `ThinSliceDemo` **`onValidSubmit`** currently sets **`setUiStage("running")`** and **`setRunStatus("submitting")`** in the **same** synchronous block, then **`queueMicrotask`** → **`inProgress`**. That **unmounts** the form before a **loading** CTA is visible — adjust sequencing per Tasks so **`submitting` is observable on input** (briefly).  
- **CTA today:** `DecisionForm.tsx` uses a **plain** `<button>` with label “Simulate My Decision” — swap to **`GlowButton`**.  
- **No** `GlowButton` file in repo yet — **create** under `src/components/shared/` per [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 3 file ownership].  
- **Types:** `UiRunStatus`, `UiStage` in `src/lib/ui-state.ts`; shell context in `src/lib/ui-shell-context.tsx`.

### Previous story intelligence (3.1)

- Tab order: Decision → five fields → **submit** — keep order; only the **button primitive** changes.  
- Validation: empty decision and bad revenue **block** `onValidSubmit` — **GlowButton** must **not** show loading in those paths.  
- `data-testid="simulate-submit"` and `decision-validation-error` tests rely on current IDs.

### Architecture compliance

- **Feature components** [Source: `_bmad-output/planning-artifacts/architecture.md` §3]: **`GlowButton`** alongside **`DecisionForm`**, **`ContextFields`**.  
- **State** [Source: architecture §6 / `ui-state.ts`]: use canonical **`runStatus`** values only — no parallel keys.  
- **Run lifecycle** [Source: architecture]: `idle → submitting → … → inProgress` for the client-visible path.

### File structure requirements

- **New:** `src/components/shared/GlowButton.tsx`  
- **Update:** `src/components/input/DecisionForm.tsx`  
- **Update:** `src/components/shell/ThinSliceDemo.tsx`  
- **Tests:** `src/components/input/DecisionForm.test.tsx`, `src/components/shell/ThinSliceDemo.test.tsx`, optional `src/components/shared/GlowButton.test.tsx`

### Testing requirements

- Preserve **Vitest + Testing Library** patterns from Stories 1.3–3.1.  
- Synchronous **`submitting`** assertion in `ThinSliceDemo.test.tsx` must remain **green** (or be **updated** with an explicit comment if product behavior intentionally changes).

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.2.  
- PRD: `_bmad-output/planning-artifacts/prd.md` — FR3.  
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` — loading / submit responsiveness; epics **UX-DR4**, **UX-DR22** (also summarized in `epics.md`).  
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — §3 components, run lifecycle.  
- Prior story: `_bmad-output/implementation-artifacts/3-1-decision-form-context-fields.md`.  
- Shell contracts: `_bmad-output/implementation-artifacts/1-4-parallel-integration-contract-ownership-boundaries.md`.

### Review Findings

- [x] [Review][Patch] `{...rest}` spread after explicit props allows callers to override `aria-busy`, `disabled`, and `className` [src/components/shared/GlowButton.tsx]
- [x] [Review][Defer] `focus-visible` ring differs from form inputs (full `ring-accent` + `ring-offset` vs inputs' `ring-accent/30`, no offset) [src/components/shared/GlowButton.tsx] — deferred, defensible deviation for button-on-accent styling; spec says "consistent with" not "identical to"
- [x] [Review][Defer] Microtask in `onValidSubmit` does not re-check `runStatus === "submitting"` before advancing to `inProgress` [src/components/shell/ThinSliceDemo.tsx] — deferred, dev-preview only concern; production path has no concurrent state change possible in that window

## Dev Agent Record

### Agent Model Used

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

---

**Ultimate context engine analysis completed — comprehensive developer guide created.**
