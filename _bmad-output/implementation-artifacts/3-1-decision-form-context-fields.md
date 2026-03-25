# Story 3.1: Decision Form & Context Fields

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want to enter my either/or decision and up to five context fields with clear guidance,
so that the simulation is grounded in my situation.

## Acceptance Criteria

_trace: FR1, FR2, UX-DR21 (inline validation on submit; empty decision blocks submit), NFR-A1, UX-DR18 (keyboard, focus, no traps); architecture §3 Feature Components (DecisionForm, ContextFields); `SimulationRequest` in `src/lib/types.ts`_

1. **Given** the user is on the input screen (`uiStage === "input"`) **when** they view the form **then** a large textarea captures the **either/or business decision** with **SMB-flavored placeholder copy** (not generic dev text) — e.g. realistic tradeoff language a bakery or retailer would recognize (FR1).
2. **And** exactly **five** context fields are present, labeled and mapped to the API contract: **Industry**, **Monthly Revenue**, **Location**, **Customer Base**, **Additional Details** — corresponding to `context.industry`, `context.monthlyRevenue`, `context.location`, `context.customerBase`, `context.details` in `SimulationRequest` (FR2).
3. **And** **inline validation on submit**: empty or whitespace-only **decision** blocks submit and surfaces a **specific** error message (not a silent no-op); other fields follow sensible validation rules where type matters (e.g. **monthly revenue** accepts numeric input with clear message if invalid) (UX-DR21).
4. **And** primary journey controls remain **keyboard operable**, **focus visible** (`focus-visible` / ring consistent with existing inputs), and the input region introduces **no focus trap** (NFR-A1, UX-DR18).

## Tasks / Subtasks

- [x] **Decision field (AC 1, 3)**  
  - [x] Replace or elevate the current thin-slice placeholder (`ThinSliceDemo` textarea) so placeholder copy reads as **SMB either/or** guidance per UX intent [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — examples/placeholders].  
  - [x] Keep **decision** as the single required field; implement **submit-time** validation with an associated **error region or `aria-live`** for the decision error (avoid relying on browser `required` alone if it prevents consistent copy — prefer controlled validation + message).

- [x] **Context fields (AC 2)**  
  - [x] Add five inputs with explicit `<label htmlFor=…>` associations and stable **ids** for testing.  
  - [x] **Monthly revenue:** align with `SimulationRequest.context.monthlyRevenue?: number` — parse from string on submit or controlled numeric handling; empty optional field should not block submit.  
  - [x] Optional string fields may remain empty strings / undefined in the assembled request object per team convention; document the chosen shape in dev notes.

- [x] **Structure & ownership (AC 1–4)**  
  - [x] Prefer extracting **`DecisionForm`** and/or **`ContextFields`** into `src/components/input/` (or `src/components/form/`) per architecture naming — **do not** leave all markup only inside `ThinSliceDemo.tsx` if it exceeds ~80 lines of form UI; keep `ThinSliceDemo` as orchestrator.  
  - [x] Preserve existing **`UiShellContext`** usage — this story does **not** change stage machine semantics; only enriches `input` stage content.

- [x] **Accessibility (AC 4)**  
  - [x] Tab order: Decision → five fields → submit (Story 3.2 may swap button for `GlowButton`; keep order stable).  
  - [x] No `tabIndex` hacks that trap focus; avoid nested interactive widgets.

- [x] **Quality gates**  
  - [x] `npm run lint`, `npm run test`, `npm run build`.  
  - [x] Add or extend a minimal test (Vitest + Testing Library if already in project) for “empty decision shows validation on submit” if test infrastructure exists.

## Dev Notes

### Intent and scope

- This story **grounds the UI in `SimulationRequest`**. It does **not** wire `POST /api/simulate` (Epic 2) or change **`GlowButton`** styling beyond what exists — **Story 3.2** owns the CTA polish, glow, and loading width (FR3, UX-DR4).  
- **Do not** implement `VizRouter`, `SimulationContainer`, or dashboard transitions here (Epic 3 later stories).

### Brownfield reality — where to edit

- **Input UI today:** `src/components/shell/ThinSliceDemo.tsx` — contains a minimal `<form>` with `decision` textarea, `derivePathLabels(decision)`, and submit that sets `uiStage` / `runStatus` without API call.  
- **Types:** `src/lib/types.ts` — `SimulationRequest.context` fields are `industry`, `monthlyRevenue`, `location`, `customerBase`, `details`.  
- **Shell contract:** `src/lib/ui-shell-context.tsx`, `src/lib/ui-state.ts` — unchanged; input stage remains full-width per Story 1.4 slot map (center panel not used at `input`).  
- **Stack:** Next `16.x`, React 19, Tailwind v4, Framer Motion — match existing class patterns (`border-border`, `bg-surface`, `focus-visible:border-accent`, etc.).

### Validation rules (recommended defaults)

| Field | Rule |
|-------|------|
| Decision | Required; trim; block submit if empty after trim. |
| Industry, Location, Customer Base, Details | Optional; trim strings. |
| Monthly revenue | Optional; if non-empty, must parse to a **finite number** ≥ 0; otherwise show inline error and block submit. |

### Assembled `context` shape (implementation)

- `buildContextPayload` in `ContextFields.tsx` builds `SimulationRequest["context"]` with **only defined keys**: optional fields omitted when empty after trim; `monthlyRevenue` included only when parsed to a non-negative finite number.

### Previous story intelligence (Epic 1)

- Story **1.4** established integration contracts and slot ownership — **input** stage is **not** mounted in `PanelSlots`; Epic 3 owns the full-width form. Do not break `SimulationShell` / `PanelSlots` contracts.  
- Story **1.4** dev notes: follow **runtime** stack versions from the codebase, not planning doc “Next.js 14” wording.

### Architecture compliance

- **Feature components** [Source: `_bmad-output/planning-artifacts/architecture.md` §3]: `DecisionForm`, `ContextFields` — implement as named building blocks.  
- **Request validation** [Source: architecture §9]: server will validate length/type later; client should still avoid absurdly long inputs (reasonable `maxLength` on decision and text fields is acceptable).  
- **State** [Source: architecture §6]: local React state in the orchestrator or a small hook is sufficient; no new global store required.

### File structure requirements

- New: `src/components/input/DecisionForm.tsx` (and/or `ContextFields.tsx`) — **or** equivalent path consistent with repo conventions.  
- Update: `src/components/shell/ThinSliceDemo.tsx` — import composed form; keep `derivePathLabels`/`onSubmit` wiring until Epic 2 passes real `SimulationRequest` to the API.

### Testing requirements

- Prefer one focused test file colocated or under `src/` `*.test.ts`/`*.test.tsx` matching existing Vitest layout.  
- If no Testing Library tests exist for shell, add the smallest possible test or document manual verification in Dev Agent Record.

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.1.  
- API request shape: `_bmad-output/planning-artifacts/architecture.md` §4 Request Contract; `src/lib/types.ts` `SimulationRequest`.  
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` — progressive disclosure, SMB placeholders, keyboard-primary journey.  
- PRD: `_bmad-output/planning-artifacts/prd.md` — FR1, FR2.  
- Slot map: `_bmad-output/implementation-artifacts/1-4-parallel-integration-contract-ownership-boundaries.md` — input stage ownership.

## Dev Agent Record

### Agent Model Used

Cursor (GPT-5.2)

### Debug Log References

None.

### Completion Notes List

- Added `DecisionForm` and `ContextFields` with SMB decision placeholder, five labeled context fields (`data-testid` on each), `noValidate` + submit-time validation for empty decision (`role="alert"`) and invalid optional monthly revenue (inline under revenue field).
- `ThinSliceDemo` now holds `DecisionFormInputState`, resets via `emptyDecisionFormState` on “Start over”, and passes validated payloads into existing mock run flow (`onValidSubmit` receives `context` for future Epic 2 wiring; not yet sent to API).
- Tests: `DecisionForm.test.tsx` (empty decision, bad revenue); `ThinSliceDemo.test.tsx` updated tab count for new fields and empty-submit integration test.
- Quality: `npm run lint`, `npm run test`, `npm run build` all pass.

### File List

- `src/components/input/ContextFields.tsx` (new)
- `src/components/input/DecisionForm.tsx` (new)
- `src/components/input/DecisionForm.test.tsx` (new)
- `src/components/shell/ThinSliceDemo.tsx` (modified)
- `src/components/shell/ThinSliceDemo.test.tsx` (modified)
- `_bmad-output/implementation-artifacts/3-1-decision-form-context-fields.md` (modified)

### Review Findings

- [x] [Review][Patch] `aria-invalid` always renders `false` on decision textarea before any interaction [`src/components/input/DecisionForm.tsx`] — change `aria-invalid={Boolean(decisionError)}` to `aria-invalid={decisionError ? true : undefined}`
- [x] [Review][Patch] `autoComplete="street-address"` semantically incorrect on Location field [`src/components/input/ContextFields.tsx`] — change to `autoComplete="off"`
- [x] [Review][Defer] `inputClassName` duplicated between `ContextFields.tsx` and `DecisionForm.tsx` [`src/components/input/ContextFields.tsx`, `src/components/input/DecisionForm.tsx`] — deferred, pre-existing style duplication; extract to shared constant in future
- [x] [Review][Defer] `revenueErrorId?: string` optional type allows `aria-describedby="undefined"` if used without pairing [`src/components/input/ContextFields.tsx`] — deferred, pre-existing; no runtime impact in current codebase; tighten type contract in future pass

## Change Log

- 2026-03-25: Implemented Story 3.1 — decision + context form, validation, tests; story marked review.
- 2026-03-25: Code review complete — 2 patch findings, 2 deferred, 1 dismissed.

---

**Ultimate context engine analysis completed — comprehensive developer guide created.**
