# Story 1.1: Thin-Slice Scaffold (User-Visible First Run)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want the app to open into a working decision flow that reaches a visible mock comparison outcome,
so that the product demonstrates value immediately, even before live orchestration is integrated.

## Acceptance Criteria

_trace: FR1, FR2, FR3, FR13, FR18 (mock slice); NFR-A2, NFR-A3, NFR-S2; UX-DR1, UX-DR2, UX-DR3, UX-DR14, UX-DR16, UX-DR17, UX-DR19; ADR-01_

1. **Given** a developer runs `npm install && npm run dev` **when** the application starts **then** the app renders a working thin slice: decision input → simulate action → running state shell → mock comparison dashboard.
2. **And** the thin slice completes with **no network calls** to `/api/simulate` or any LLM/map provider (100% local transition using client state and inline mock result).
3. **And** **Path A | center | Path B** orientation is preserved in both **running** and **dashboard** states (three-column grid or flex regions with stable order).
4. **And** the project runs **App Router** with **TypeScript** + **Tailwind CSS** + **Framer Motion** installed and used for at least one meaningful transition (e.g. input → running layout).
5. **And** `src/app/layout.tsx` loads **Google Fonts**: Space Grotesk, DM Sans, JetBrains Mono (via `next/font/google`), exposes CSS variables on `<html>` or `<body>`, and sets **FORESIGHT**-appropriate `metadata` (title + description).
6. **And** `src/app/globals.css` defines CSS custom properties for the thin-slice palette: `--bg`, `--surface`, `--border`, `--accent`, `--blue`, `--red`, `--gold`, `--text`, `--text-dim` (values per UX spec below).
7. **And** Tailwind **v4** theme extensions map those tokens (and typography scale H1–caption + **8px spacing** scale 4/8/16/24/32/40/48) via `@theme` in `globals.css` or the project’s established Tailwind v4 pattern.
8. **And** responsive breakpoints follow **sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536** (desktop-first behavior at `lg+`).
9. **And** a **`prefers-reduced-motion`** utility or media block reduces non-essential motion (e.g. disable Framer layout animations or shorten durations when `(prefers-reduced-motion: reduce)`).
10. **And** **base `:focus-visible`** styles apply to interactive elements (keyboard-visible focus rings meeting contrast on dark surfaces).
11. **And** default **body text on `--surface` / `--bg`** meets **WCAG 2.1 AA** contrast for normal text (use UX token hex values; verify if adjusting).

## Tasks / Subtasks

- [x] **Dependencies (AC 4)**  
  - [x] Add `framer-motion`; confirm peer compatibility with current React (see Dev Notes).  
  - [x] Run `npm run build` after install to verify lockfile and types.
- [x] **Fonts + metadata (AC 5)**  
  - [x] Replace Geist with Space Grotesk (headings UI), DM Sans (body/labels), JetBrains Mono (numeric mock KPIs).  
  - [x] Wire font variables into Tailwind theme (`@theme` font families).
- [x] **Design tokens + Tailwind v4 (AC 6–8)**  
  - [x] Set `:root` dark base using `--bg` `#0F1923` and companion tokens per UX-DR1 (`--surface` `#1B2838`, `--border` `#2A3A4A`, `--accent` `#00D4AA`, `--blue` `#2196F3`, `--red` `#FF4757`, `--gold` `#FFD700`, `--text` `#F0F4F8`, `--text-dim` `#8892A0`).  
  - [x] Extend `@theme` with colors, font sizes (H1 32–36px, H2 24–28px, H3 18–20px, body 14–16px, caption 12–13px, KPI numeric 20–28px mono), and spacing scale.  
  - [x] Set `body` default background/color to theme tokens (dark-first product shell).
- [x] **Thin-slice UX (AC 1–3)**  
  - [x] **Input:** decision text field + minimal context fields (align with PRD “up to 5” — can be 1–2 fields for slice) + primary CTA label consistent with product (“Simulate My Decision” or agreed copy).  
  - [x] **Simulate:** on submit, transition to **running**: three panels with Path A / center / Path B; center shows placeholder for “intelligence” (e.g. “Simulating…”); side panels show path labels derived from user text **or** simple “Path A” / “Path B” until parser exists — labels must occupy panel header area.  
  - [x] **Dashboard:** after a short **local** delay (`setTimeout` or `motion` onComplete), show **mock** KPI comparison (e.g. two columns or mirrored cards) without fetching.  
  - [x] **No live API (AC 2):** no `fetch`/`POST` to `/api/simulate` in this story.
- [x] **Motion + a11y (AC 4, 9–11)**  
  - [x] Framer Motion for panel entrance or state change; gate decorative motion with `prefers-reduced-motion`.  
  - [x] `:focus-visible` ring using accent or high-contrast outline.
- [x] **Cleanup**  
  - [x] Remove default Next.js template marketing content from `page.tsx` (logos, deploy links) so the thin slice is the home experience.

### Review Findings

- [x] [Review][Patch] SSR hydration mismatch from `useReducedMotion()` returning null on server [`src/components/shell/ThinSliceDemo.tsx`] — Fixed: replaced manual `useReducedMotion()` hook + conditional logic with `<MotionConfig reducedMotion="user">`. Framer Motion now handles reduced-motion SSR-safely at the context level; all manual conditionals removed.
- [x] [Review][Patch] `running` stage `initial` prop not guarded by `prefersReducedMotion` [`src/components/shell/ThinSliceDemo.tsx` ~L155] — Fixed: resolved as part of P1 fix; `MotionConfig reducedMotion="user"` handles all stages uniformly, eliminating per-stage conditionals.
- [x] [Review][Patch] `contextNote` state collected but silently discarded [`src/components/shell/ThinSliceDemo.tsx` ~L55] — Fixed: removed "Context (optional)" input field and `contextNote` state entirely. Decision field is sufficient for the 1.1 thin slice.
- [x] [Review][Patch] Spacing scale gap — `--spacing-3` absent but `py-3` used in component [`src/app/globals.css`] — Fixed: added `--spacing-3: 0.75rem` and `--spacing-5: 1.25rem` to `@theme inline` spacing block.
- [x] [Review][Defer] `globals: true` in vitest.config redundant with explicit `vitest` imports in test files [`vitest.config.ts`] — deferred, pre-existing pattern choice
- [x] [Review][Defer] `fireEvent` + `userEvent` mixed in integration test [`src/components/shell/ThinSliceDemo.test.tsx`] — deferred, pre-existing intentional workaround documented in Dev Agent Record debug log

## Dev Notes

### Brownfield reality (read first)

- **Entry:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — not `app/` at repo root.  
- **Stack today:** `package.json` shows **Next `16.2.1`**, **React `19.2.x`**, **Tailwind v4** (`@import "tailwindcss"` + `@theme inline`). Planning docs often say “Next.js 14”; treat **ADR-01** as “App Router on Vercel,” **do not downgrade** Next/React just to match the number “14.”  
- **Tailwind v4:** prefer **`@theme` in `globals.css`** over a legacy `tailwind.config.js` unless the repo already adds one later.

### Architecture compliance

- **State:** Local React state (`useState` / `useReducer`) is sufficient for this story; full `uiStage` / `runStatus` machine lands in **Story 1.3** — implement only what’s needed to show **input → running → dashboard** credibly.  
- **Contract:** Full `SimulationResponse` typing and shared fixture live in **Story 1.2**. For **1.1**, an **inline mock object** or a tiny `lib/thin-slice-mock.ts` is acceptable if comments state it will be replaced by `lib/types.ts` + canonical fixture.  
- **HTTPS (NFR-S2):** satisfied in production by Vercel; no extra work for local dev.

### UX alignment (thin slice subset)

- **Direction 6:** center column carries the primary “intelligence” (`ux-design-specification.md` — Comparison layout). For running state, center is a placeholder; for dashboard, center holds comparison focus or coordinates side panels.  
- **Typography (UX-DR2):** Space Grotesk / DM Sans / JetBrains Mono hierarchy — apply to headings, body, and numeric KPI mock.  
- **Spacing (UX-DR3):** 8px base rhythm in panel padding and gaps.

### Suggested file touch list

| Area | Files |
|------|-------|
| Shell | `src/app/layout.tsx`, `src/app/globals.css` |
| Slice | `src/app/page.tsx` (or split: `components/shell/ThinSliceDemo.tsx` if > ~200 lines) |
| Optional mock | `src/lib/thin-slice-mock.ts` (provisional) |

Respect **Epic 3 / 5 ownership** from `epics.md` for future splits; for **1.1**, colocating in `page.tsx` or a single `components/` file is fine.

### Framer Motion + React 19

- Use **`"use client"`** on components that call `motion` hooks.  
- After install, run **`npm run lint`** and **`npm run build`**. If peer dependency warnings appear, resolve with the version Framer documents for React 19 or use `overrides` only if necessary and justified.

### Testing / verification

- Manual: `npm run dev` → enter text → CTA → see three-panel running → land on mock dashboard; repeat with keyboard (Tab to CTA, Enter).  
- Toggle OS “reduce motion” and confirm animations simplify or skip.  
- `npm run lint` + `npm run build` clean.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.1]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — §3 App/Shell, §6 State Management Strategy, ADR-01]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR1–3, UX-DR14, UX-DR16–17, UX-DR19, Executive Summary / Core UX]  
- [Source: `_bmad-output/planning-artifacts/epics.md` — Additional Requirements ADR-01, state keys for later stories]

## Dev Agent Record

### Agent Model Used

Cursor agent (dev-story workflow)

### Debug Log References

- Vitest: `getByLabelText(/decision/i)` conflicted with region `aria-label` "Decision input"; switched to `getByRole("textbox", { name: "Decision" })`.
- Fake timers + `userEvent` / Framer Motion caused flaky hangs; integration test uses real time + `fireEvent.change` wrapped in `act` for the decision field.

### Completion Notes List

- Implemented thin-slice flow in `ThinSliceDemo` (input → running 3-column grid → mock dashboard after local timeout); path labels via simple `vs` / `|` heuristics with fallback to Path A/B.
- Replaced Geist with Space Grotesk, DM Sans, JetBrains Mono; FORESIGHT metadata; full UX token palette and `@theme` typography/spacing/breakpoints in `globals.css`.
- Added `useReducedMotion()` + CSS `prefers-reduced-motion` block; accent `:focus-visible` rings.
- Added `framer-motion`, Vitest + RTL + `user-event` for component/unit tests; no `/api/simulate` or other network calls in the slice.

### File List

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `src/lib/thin-slice-mock.ts`
- `src/lib/thin-slice-mock.test.ts`
- `src/test/setup.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-03-24:** Story 1.1 — thin-slice scaffold, design tokens, fonts, Framer Motion transitions, provisional mock module, Vitest coverage; sprint status `1-1-thin-slice-scaffold-user-visible-first-run` → `review`.

---

**Story completion status**

- Status: **done**  
- Note: All review patches applied — `MotionConfig reducedMotion="user"` replaces manual `useReducedMotion()`, `contextNote` dead state removed, spacing scale completed.

_Open questions (non-blocking): exact CTA copy and whether path labels in 1.1 use simple literals vs. naive split heuristic — prefer simplest that demos orientation; parser owns real labels in Epic 2._
