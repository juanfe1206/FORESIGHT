# Story 4.3: Deep Dive Panel, Path Tabs & Narrative With Attribution

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a small business owner,
after seeing KPIs, I want a tabbed month-by-month story with clear agent attribution,
so that I understand why each path diverges.

## Acceptance Criteria

_trace: FR26, FR27, UX-DR12, UX-DR15, UX-DR18; Epic 4 Story 4.3 in `epics.md`; `docs/integration-contracts.md` C5 `DeepDivePanelSlotProps`; architecture §3 Feature Components, §6 State Management_

1. **Given** `uiStage` moves to `deepDive` from `dashboard`
   **When** the transition runs (~0.6s per UX-DR15)
   **Then** a three-column layout renders with `lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)]` (center expanded); side panels show compressed strips with path label, overall score, and truncated summary; center shows `DeepDivePanel` (FR26, UX-DR12).

2. **And** a "Read Full Story" button exists in the `dashboard` stage that calls `setUiStage("deepDive")`; a "← Back" button in the `deepDive` stage calls `setUiStage("dashboard")` (not `resetToInput`).

3. **And** `DeepDivePanel` renders `PathTabs` with two tabs: "Path A" (default active) and "Path B"; clicking or keyboard-navigating (ArrowLeft/ArrowRight) switches the visible narrative panel (FR27, UX-DR18).

4. **And** tabs conform to ARIA pattern: `role="tablist"` on the tab container; each tab `role="tab"`, `aria-selected`, `aria-controls`; each content `role="tabpanel"`, `id` matching `aria-controls`; `tabIndex` managed so active tab is in natural tab order, inactive tabs use `tabIndex={-1}`.

5. **And** for each `TimelineEntry` in `pathData.synthesis.timeline`, `NarrativeBlock` renders: the month label (e.g., "Month 1"), the `narrative` text, and one colored attribution dot per `driver` entry — color derived from driver's index position in `AGENT_ROLES[viz_type]` (Slot 0 = blue, 1 = red, 2 = accent, 3 = gold); dots are `title`-attributed with the driver name for accessibility.

6. **And** narrative content is read exclusively from `pathData.synthesis.summary` and `pathData.synthesis.timeline` — **no LLM prompt text parsing in the UI**.

7. **And** `DeepDivePanel` accepts `DeepDivePanelSlotProps` from `src/lib/integration-contracts.ts` and does **not** define parallel or duplicate types.

8. **And** transitions use Framer Motion with `MotionConfig reducedMotion="user"` (already set in `ThinSliceDemo`); reduced-motion path renders final state immediately.

9. **And** tests: `DeepDivePanel` renders with `MOCK_DEEP_DIVE_PROPS` without throwing; Path B tab click shows Path B timeline; ArrowRight key on Path A tab activates Path B tab; attribution dots rendered per driver; `DeepDiveStrip` renders path label and score.

## Tasks / Subtasks

- [x] **Create `src/components/narrative/` component tree** (AC: 1, 3, 5, 7)
  - [x] `src/components/narrative/DeepDivePanel.tsx` — `"use client"`; accepts `DeepDivePanelSlotProps`; renders `PathTabs` + active path's narrative blocks; uses `AGENT_ROLES` for attribution color derivation
  - [x] `src/components/narrative/PathTabs.tsx` — `"use client"`; ARIA tablist; `selectedPath` state (default `"A"`); ArrowLeft/ArrowRight keyboard cycling; renders tab buttons + slots for tab panels
  - [x] `src/components/narrative/NarrativeBlock.tsx` — pure presentational; renders month label, narrative text, and attribution dots row
  - [x] `src/components/narrative/DeepDiveStrip.tsx` — compressed side strip; accepts `{ pathLabel, score, summary }` props; shows path label (heading), score number, truncated summary (max 120 chars)
  - [x] `src/components/narrative/index.ts` — barrel: `export { DeepDivePanel } from './DeepDivePanel'`; `export { DeepDiveStrip } from './DeepDiveStrip'`

- [x] **Wire DeepDivePanel into ThinSliceDemo `deepDive` stage** (AC: 1, 3)
  - [x] Import `DeepDivePanel` from `@/components/narrative` and `MOCK_DEEP_DIVE_PROPS` from `@/lib/integration-contracts`
  - [x] Replace center `CenterPanelSlot` placeholder text with `<DeepDivePanel {...MOCK_DEEP_DIVE_PROPS} viz_type={vizType} />`
  - [x] Replace left strip placeholder with `<DeepDiveStrip pathLabel={pathLabels[0]} score={MOCK_DEEP_DIVE_PROPS.pathA.kpis.overallScore} summary={MOCK_DEEP_DIVE_PROPS.pathA.synthesis.summary} />`
  - [x] Replace right strip placeholder with `<DeepDiveStrip pathLabel={pathLabels[1]} score={MOCK_DEEP_DIVE_PROPS.pathB.kpis.overallScore} summary={MOCK_DEEP_DIVE_PROPS.pathB.synthesis.summary} />`

- [x] **Add dashboard → deepDive CTA and deepDive → dashboard back navigation** (AC: 2)
  - [x] In the `dashboard` stage, add a "Read Full Story" button below the 3-column grid (alongside the existing "Start over" button); on click: `setUiStage("deepDive")`; style: `bg-accent` filled, `font-heading text-body font-semibold text-bg`, min-h 40px
  - [x] In the `deepDive` stage, add a "← Back to comparison" button that calls `setUiStage("dashboard")` — NOT `resetToInput`; use secondary style (outlined, `border-border hover:border-accent hover:text-accent`)
  - [x] Add `data-testid="read-full-story-btn"` and `data-testid="back-to-dashboard-btn"` to the respective buttons

- [x] **PathTabs ARIA and keyboard implementation** (AC: 3, 4)
  - [x] Tab container: `role="tablist"` `aria-label="Simulation path narrative"`
  - [x] Tab A button: `role="tab"` `id="tab-path-a"` `aria-selected={selectedPath === "A"}` `aria-controls="panel-path-a"` `tabIndex={selectedPath === "A" ? 0 : -1}`
  - [x] Tab B button: `role="tab"` `id="tab-path-b"` `aria-selected={selectedPath === "B"}` `aria-controls="panel-path-b"` `tabIndex={selectedPath === "B" ? 0 : -1}`
  - [x] Panel A: `role="tabpanel"` `id="panel-path-a"` `aria-labelledby="tab-path-a"` — hidden when Path B active
  - [x] Panel B: `role="tabpanel"` `id="panel-path-b"` `aria-labelledby="tab-path-b"` — hidden when Path A active
  - [x] `onKeyDown` on each tab: ArrowRight → activate Path B; ArrowLeft → activate Path A; focus the newly activated tab via `ref.focus()`

- [x] **Attribution dot color derivation** (AC: 5)
  - [x] Define slot colors constant in `DeepDivePanel.tsx` (or shared util):
    ```ts
    const SLOT_BG: Record<number, string> = {
      0: "bg-blue",   // Slot 1 blue
      1: "bg-red",    // Slot 2 red
      2: "bg-accent", // Slot 3 green
      3: "bg-gold",   // Slot 4 gold
    };
    ```
  - [x] `getDriverSlotIndex(driver: string, viz_type: VizType): number` — returns `AGENT_ROLES[viz_type].findIndex(r => r.toLowerCase() === driver.toLowerCase())`; returns `-1` if not found
  - [x] Attribution dot: 8px circle (`w-2 h-2 rounded-full`), color from `SLOT_BG[idx]` or `bg-text-dim` for unknown drivers; `title={driver}` for hover tooltip accessibility

- [x] **Verification** (AC: 9)
  - [x] `npm run lint`, `npm run test`, `npm run build`
  - [x] `DeepDivePanel` renders with `MOCK_DEEP_DIVE_PROPS` and `viz_type="map"` without throwing
  - [x] Tab switch: Path B tab click shows Path B month narratives
  - [x] Keyboard: ArrowRight on Path A tab activates Path B; ArrowLeft on Path B activates Path A
  - [x] Attribution dots: Month 1 of Path A shows dots for "Customer" (blue) and "Cash Flow" (gold)
  - [x] `DeepDiveStrip` renders path label, score as number, and non-empty summary text
  - [x] "Read Full Story" button exists in dashboard stage and transitions to deepDive
  - [x] "← Back to comparison" button in deepDive transitions to dashboard (not input)
  - [x] No regression: existing `ThinSliceDemo.test.tsx`, `ModeBadge.test.tsx`, `VizMapSideCanvas.test.tsx`, `MapHalf.test.tsx` still pass
  - [x] Reduced-motion: verify narrative fades skip in `prefers-reduced-motion` — `MotionConfig reducedMotion="user"` on `ThinSliceDemo`; optional browser spot-check

## Dev Notes

### Architecture Compliance

- **Stack (follow the repo, not architecture.md):** Next.js **16.2.1**, React **19.2.4**, Framer Motion **12.x**, Tailwind **v4**. Architecture doc says "Next.js 14" — that's wrong for this repo; follow `package.json`.
- **Contract:** C5 `DeepDivePanelSlotProps` — `src/lib/integration-contracts.ts`; mock: `MOCK_DEEP_DIVE_PROPS`. Do NOT define parallel types. Contract is already defined.
- **Shell state:** `uiStage` and `setUiStage` are in `UiShellContext` (`src/lib/ui-shell-context.tsx`). `ThinSliceDemo.tsx` holds state locally and passes via context. Use `setUiStage` directly from local state in `ThinSliceDemo`.
- **File ownership:** `components/narrative/` — Epic 4. No modifications to `components/viz/`, `components/shell/PanelSlots.tsx`, `lib/types.ts`, or `lib/integration-contracts.ts` needed.
- **Epic boundaries:** Do NOT implement KPI cards, ScoreRings, or AgentHUD here. The dashboard center placeholder ("Comparison" text) is Epic 5 territory — do not modify it. Only add the "Read Full Story" button as a light-touch addition below the grid.

### Component Architecture

```
src/components/narrative/
├── index.ts                  ← barrel: export { DeepDivePanel, DeepDiveStrip }
├── DeepDivePanel.tsx          ← "use client"; top-level; accepts DeepDivePanelSlotProps + viz_type
├── PathTabs.tsx               ← "use client"; ARIA tablist; keyboard nav; selectedPath state
├── NarrativeBlock.tsx         ← presentational; month + narrative text + attribution dots
├── DeepDiveStrip.tsx          ← presentational; compressed side strip (label, score, summary)
├── DeepDivePanel.test.tsx     ← tests
```

### DeepDivePanelSlotProps Contract (already exists in integration-contracts.ts)

```ts
// src/lib/integration-contracts.ts — DO NOT redefine
export interface DeepDivePanelSlotProps {
  pathA: PathData;
  pathB: PathData;
  pathLabels: { A: string; B: string };
}

export const MOCK_DEEP_DIVE_PROPS: DeepDivePanelSlotProps = {
  pathA: fx.paths.A,
  pathB: fx.paths.B,
  pathLabels: fx.path_labels,
};
```

`PathData` from `src/lib/types.ts`:
```ts
interface PathData {
  agents: AgentOutput[];       // role, insight, confidence, grounding
  synthesis: PathSynthesis;   // { summary: string; timeline: TimelineEntry[] }
  kpis: KPIs;                 // includes overallScore: number
}
interface TimelineEntry {
  month: number;
  narrative: string;
  drivers: string[];  // e.g. ["Customer", "Cash Flow"] — matched to AGENT_ROLES
}
```

### DeepDivePanel Implementation Reference

```tsx
// src/components/narrative/DeepDivePanel.tsx
"use client";

import { AGENT_ROLES } from "@/lib/types";
import type { VizType } from "@/lib/types";
import type { DeepDivePanelSlotProps } from "@/lib/integration-contracts";
import { PathTabs } from "./PathTabs";
import { NarrativeBlock } from "./NarrativeBlock";

const SLOT_BG: Record<number, string> = {
  0: "bg-blue",
  1: "bg-red",
  2: "bg-accent",
  3: "bg-gold",
};

function getDriverColor(driver: string, vizType: VizType): string {
  const roles = AGENT_ROLES[vizType];
  const idx = roles.findIndex((r) => r.toLowerCase() === driver.toLowerCase());
  return idx >= 0 ? (SLOT_BG[idx] ?? "bg-text-dim") : "bg-text-dim";
}

export function DeepDivePanel({
  pathA,
  pathB,
  pathLabels,
  viz_type,
}: DeepDivePanelSlotProps & { viz_type: VizType }) {
  return (
    <PathTabs
      labelA={pathLabels.A}
      labelB={pathLabels.B}
      panelA={
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-dim">{pathA.synthesis.summary}</p>
          {pathA.synthesis.timeline.map((entry) => (
            <NarrativeBlock
              key={entry.month}
              month={entry.month}
              narrative={entry.narrative}
              drivers={entry.drivers}
              getDriverColor={(d) => getDriverColor(d, viz_type)}
            />
          ))}
        </div>
      }
      panelB={
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-dim">{pathB.synthesis.summary}</p>
          {pathB.synthesis.timeline.map((entry) => (
            <NarrativeBlock
              key={entry.month}
              month={entry.month}
              narrative={entry.narrative}
              drivers={entry.drivers}
              getDriverColor={(d) => getDriverColor(d, viz_type)}
            />
          ))}
        </div>
      }
    />
  );
}
```

### PathTabs ARIA + Keyboard Reference

```tsx
// src/components/narrative/PathTabs.tsx
"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

interface PathTabsProps {
  labelA: string;
  labelB: string;
  panelA: ReactNode;
  panelB: ReactNode;
}

export function PathTabs({ labelA, labelB, panelA, panelB }: PathTabsProps) {
  const [selected, setSelected] = useState<"A" | "B">("A");
  const tabARef = useRef<HTMLButtonElement>(null);
  const tabBRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, current: "A" | "B") => {
    if (e.key === "ArrowRight" && current === "A") {
      setSelected("B");
      tabBRef.current?.focus();
    } else if (e.key === "ArrowLeft" && current === "B") {
      setSelected("A");
      tabARef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Simulation path narrative" className="flex gap-2 border-b border-border pb-2">
        <button
          ref={tabARef}
          role="tab"
          id="tab-path-a"
          aria-selected={selected === "A"}
          aria-controls="panel-path-a"
          tabIndex={selected === "A" ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, "A")}
          onClick={() => setSelected("A")}
          className={`rounded-md px-4 py-2 text-body font-medium transition ${
            selected === "A"
              ? "bg-accent text-bg"
              : "text-text-dim hover:text-text"
          }`}
        >
          {labelA}
        </button>
        <button
          ref={tabBRef}
          role="tab"
          id="tab-path-b"
          aria-selected={selected === "B"}
          aria-controls="panel-path-b"
          tabIndex={selected === "B" ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, "B")}
          onClick={() => setSelected("B")}
          className={`rounded-md px-4 py-2 text-body font-medium transition ${
            selected === "B"
              ? "bg-blue text-bg"
              : "text-text-dim hover:text-text"
          }`}
        >
          {labelB}
        </button>
      </div>

      <div
        role="tabpanel"
        id="panel-path-a"
        aria-labelledby="tab-path-a"
        hidden={selected !== "A"}
      >
        {panelA}
      </div>
      <div
        role="tabpanel"
        id="panel-path-b"
        aria-labelledby="tab-path-b"
        hidden={selected !== "B"}
      >
        {panelB}
      </div>
    </div>
  );
}
```

### NarrativeBlock Reference

```tsx
// src/components/narrative/NarrativeBlock.tsx
interface NarrativeBlockProps {
  month: number;
  narrative: string;
  drivers: string[];
  getDriverColor: (driver: string) => string;
}

export function NarrativeBlock({ month, narrative, drivers, getDriverColor }: NarrativeBlockProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption font-medium text-text-dim">Month {month}</span>
        <div className="flex items-center gap-1.5" aria-label="Contributing agents">
          {drivers.map((driver) => (
            <span
              key={driver}
              title={driver}
              className={`inline-block h-2 w-2 rounded-full ${getDriverColor(driver)}`}
            />
          ))}
        </div>
      </div>
      <p className="text-body text-text">{narrative}</p>
    </div>
  );
}
```

### DeepDiveStrip Reference

```tsx
// src/components/narrative/DeepDiveStrip.tsx
interface DeepDiveStripProps {
  pathLabel: string;
  score: number;
  summary: string;
}

export function DeepDiveStrip({ pathLabel, score, summary }: DeepDiveStripProps) {
  const truncated = summary.length > 120 ? summary.slice(0, 117) + "…" : summary;
  return (
    <div className="flex flex-col gap-3 p-2">
      <p className="font-heading text-h3 truncate text-text" title={pathLabel}>
        {pathLabel}
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-kpi text-accent">{score}</span>
        <span className="text-caption text-text-dim">/ 100</span>
      </div>
      <p className="text-caption text-text-dim line-clamp-4">{truncated}</p>
    </div>
  );
}
```

### ThinSliceDemo Changes Reference

```tsx
// In dashboard stage — add below the 3-col grid, above "Start over":
<div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
  <button
    type="button"
    data-testid="read-full-story-btn"
    onClick={() => setUiStage("deepDive")}
    className="rounded-lg bg-accent px-6 py-3 font-heading text-body font-semibold text-bg transition hover:opacity-90"
  >
    Read Full Story
  </button>
  <button
    type="button"
    onClick={resetToInput}
    className="rounded-lg border border-border py-3 px-6 text-body text-text transition hover:border-accent hover:text-accent"
  >
    Start over
  </button>
</div>

// In deepDive stage — add "Back" button after the 3-col grid:
<button
  type="button"
  data-testid="back-to-dashboard-btn"
  onClick={() => setUiStage("dashboard")}
  className="rounded-lg border border-border px-6 py-3 text-body text-text transition hover:border-accent hover:text-accent sm:mx-auto sm:max-w-xs w-full sm:w-auto"
>
  ← Back to comparison
</button>

// In deepDive stage center (replace the existing placeholder):
import { DeepDivePanel } from "@/components/narrative";
import { MOCK_DEEP_DIVE_PROPS } from "@/lib/integration-contracts";
import { DeepDiveStrip } from "@/components/narrative";

// Center CenterPanelSlot children:
<DeepDivePanel
  pathA={MOCK_DEEP_DIVE_PROPS.pathA}
  pathB={MOCK_DEEP_DIVE_PROPS.pathB}
  pathLabels={MOCK_DEEP_DIVE_PROPS.pathLabels}
  viz_type={vizType}
/>

// Left LeftPanelSlot children (inside VizMapSideCanvas wrapper):
<DeepDiveStrip
  pathLabel={pathLabels[0]}
  score={MOCK_DEEP_DIVE_PROPS.pathA.kpis.overallScore}
  summary={MOCK_DEEP_DIVE_PROPS.pathA.synthesis.summary}
/>

// Right RightPanelSlot children (inside VizMapSideCanvas wrapper):
<DeepDiveStrip
  pathLabel={pathLabels[1]}
  score={MOCK_DEEP_DIVE_PROPS.pathB.kpis.overallScore}
  summary={MOCK_DEEP_DIVE_PROPS.pathB.synthesis.summary}
/>
```

### Attribution Color Mapping

| AGENT_ROLES index | Map roles | Color token | Tailwind class |
|---|---|---|---|
| 0 | Customer | #2196F3 | `bg-blue` |
| 1 | Competitor | #FF4757 | `bg-red` |
| 2 | Market | #00D4AA | `bg-accent` |
| 3 | Cash Flow | #FFD700 | `bg-gold` |

Same slot ordering applies for `flow` (Resource Impact / Opportunity Cost / Market Timing / Cash Flow) and `network` (Stakeholder / Partnership / Ecosystem / Risk-Reward).

### Animation Spec (UX-DR15 + UX-DR24)

Dashboard → Deep Dive transition (~0.6s):
- `AnimatePresence mode="wait"` in `ThinSliceDemo` already handles stage switch with `exit` → `animate` sequence
- Side strips: `initial={{ opacity: 0, x: -8 }}` `animate={{ opacity: 1, x: 0 }}` spring
- Center panel: `initial={{ opacity: 0, y: 10 }}` `animate={{ opacity: 1, y: 0 }}` spring
- Narrative blocks: `opacity 0→1` staggered `0.05s` per block (optional — omit if complex)
- Reduced-motion: `MotionConfig reducedMotion="user"` already set in `ThinSliceDemo` — no extra work needed

### Design Tokens

```tsx
// ✅ Token-aligned
"bg-accent"          // #00D4AA — Path A tab active, "Read Full Story" button
"bg-blue"            // #2196F3 — Path B tab active, Slot 0 attribution dot
"bg-red"             // #FF4757 — Slot 1 attribution dot
"bg-gold"            // #FFD700 — Slot 3 attribution dot
"text-text-dim"      // #8892A0 — month labels, secondary text
"border-border"      // #2A3A4A — card borders
"bg-surface"         // #1B2838 — narrative block background
"font-mono"          // JetBrains Mono — score number, month label
"text-kpi"           // 20-28px mono — score display
"text-caption"       // 12-13px — month label, driver tooltip
"text-body"          // 14-16px — narrative text
```

### Narrative Content Sources (No UI Parsing)

All narrative content comes directly from `PathData.synthesis`:
```ts
pathData.synthesis.summary       // full path summary — shown at top of tab panel
pathData.synthesis.timeline[]    // TimelineEntry[]
  .month                          // number — "Month N" label
  .narrative                      // string — paragraph text
  .drivers                        // string[] — agent role names → attribution dots
```

Do NOT parse agent `.insight` text into UI. Do NOT generate narrative from KPI values.

### What NOT to Modify

- `src/lib/types.ts` — no new types needed; `PathData`, `TimelineEntry`, `VizType`, `AGENT_ROLES` all exist
- `src/lib/integration-contracts.ts` — `DeepDivePanelSlotProps` and `MOCK_DEEP_DIVE_PROPS` already defined
- `src/lib/ui-state.ts`, `src/lib/ui-shell-context.tsx` — no state changes needed
- `src/components/shell/VizMapSideCanvas.tsx` — do not modify; use as wrapper in strips
- `src/components/running/ModeBadge.tsx` — already in deepDive stage via `VizOrientationBand`
- `src/components/viz/MapView/` — do not modify; no map in this story
- Dashboard center `CenterPanelSlot` content — Epic 5 territory; only add "Read Full Story" button *below* the grid, not *inside* the center panel
- Dashboard-stage `VizMapSideCanvas` children in `ThinSliceDemo.tsx` — Epic 5 territory
- The `resetToInput` function — reuse as-is for "Start over"; do NOT use it for "Back" from deepDive

### Testing Approach

```tsx
// src/components/narrative/DeepDivePanel.test.tsx
// Mock 'next/dynamic' is already set up in src/test/setup.ts
// Import: MOCK_DEEP_DIVE_PROPS from '@/lib/integration-contracts'

// Test 1: DeepDivePanel renders with MOCK_DEEP_DIVE_PROPS + viz_type="map" without throwing
// Test 2: Path A tab is selected by default; Path A timeline content is visible
// Test 3: Clicking Path B tab shows Path B month narratives (path B summary visible)
// Test 4: ArrowRight key on Path A tab activates Path B tab (aria-selected="true" on Path B)
// Test 5: ArrowLeft key on Path B tab activates Path A tab
// Test 6: Attribution dots rendered — Month 1 Path A has 2 dots (drivers: Customer, Cash Flow)
// Test 7: DeepDiveStrip renders pathLabel, score number, and non-empty summary text
```

**Note on `hidden` attribute:** `role="tabpanel" hidden` hides content from AT and DOM rendering. In `@testing-library/react`, hidden panels won't appear in `getByText` — use `queryByText` / check `hidden` attribute directly to test that inactive panel is hidden.

### Previous Story Intelligence

Story 4.1 completed:
- `VizMapSideCanvas` (`src/components/shell/VizMapSideCanvas.tsx`) — canvas wrapper; present in deepDive strips; do not remove
- `ModeBadge` + `VizOrientationBand` — `VizOrientationBand` is already rendered in the `deepDive` stage header

Story 4.2 completed:
- `MapHalf` under `src/components/viz/MapView/` — already wired to running stage; do NOT add it to deepDive strips (too complex for compressed view)
- Vitest mocks for `next/dynamic` and `react-map-gl/mapbox` set up in `src/test/setup.ts` — reuse this pattern
- `MOCK_BAKERY_MAP_FIXTURE.paths.A.synthesis.timeline` has 4 entries (months 1, 2, 3, 6) — your tests can reference these
- Code pattern: `"use client"` at top, `@/` path aliases, token classes only (no raw hex)
- Testing pattern: `@testing-library/react`, `data-testid`, `vi.mock` for heavy deps

**Story 4.2 review learnings to NOT repeat:**
- Do NOT use `aria-hidden` to hide tab panel content — use `hidden` attribute on `role="tabpanel"` per ARIA spec
- Ensure cleanup of any `setTimeout`/RAF refs on unmount to avoid test leaks

### Git Intelligence

Recent commits show:
- `"use client"` at top of all interactive components
- `@/` path aliases throughout (e.g., `@/lib/integration-contracts`, `@/components/narrative`)
- Token-class-only styling in TSX (no raw hex values)
- Framer Motion spring: `stiffness: 320, damping: 28` used in shell transitions
- Vitest with `@testing-library/react`; `screen.getByRole`, `userEvent.click` patterns
- Components added under `src/components/[domain]/` — follow `src/components/narrative/`

### Latest Technical Notes

- **Framer Motion 12.x + React 19:** No breaking changes for basic `motion.div`, `AnimatePresence`. `MotionConfig reducedMotion="user"` already wraps `ThinSliceDemo` — all descendant Framer Motion components auto-respect it.
- **ARIA tablist pattern in React 19:** Standard — no breaking changes. Use `hidden` attribute (not CSS `display:none`) on tabpanels so AT announces correctly and testing-library can assert on it.
- **Tailwind v4 `line-clamp`:** Available natively — `line-clamp-4` works without `@tailwindcss/line-clamp` plugin.
- **`hidden` vs `display:none` on tabpanel:** Using `hidden={selected !== "A"}` on a JSX element translates to the HTML `hidden` attribute, which is correct for accessible tab panels. Do NOT use `className="hidden"` (Tailwind utility) for the panel hide — use the HTML boolean attribute.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

None.

### Completion Notes List

- Added `src/components/narrative/*`: `DeepDivePanel` (contract props + `viz_type`, `SLOT_BG` + `getDriverSlotIndex`), `PathTabs` (ARIA tablist, Path A/B labels per AC3, arrow keys + focus), `NarrativeBlock`, `DeepDiveStrip`, barrel `index.ts`.
- Wired `ThinSliceDemo`: dashboard CTA row (Read Full Story + Start over), deep-dive strips/center with `MOCK_DEEP_DIVE_PROPS`, motion on strips/center, back button uses `setUiStage("dashboard")`.
- Tests: `DeepDivePanel.test.tsx` (render, tabs, keyboard, attribution, strip truncation); `ThinSliceDemo.test.tsx` integration with `waitFor` after dev stage jump (AnimatePresence exit).
- `npm run lint`, `npm run test`, `npm run build` all pass.

### File List

- `src/components/narrative/DeepDivePanel.tsx`
- `src/components/narrative/PathTabs.tsx`
- `src/components/narrative/NarrativeBlock.tsx`
- `src/components/narrative/DeepDiveStrip.tsx`
- `src/components/narrative/index.ts`
- `src/components/narrative/DeepDivePanel.test.tsx`
- `src/components/shell/ThinSliceDemo.tsx`
- `src/components/shell/ThinSliceDemo.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-3-deep-dive-panel-path-tabs-narrative-with-attribution.md`

### Review Findings

- [x] [Review][Patch] Tab labels hardcoded "Path A"/"Path B" — PathTabs must accept labelA/labelB props; DeepDivePanel must pass pathLabels.A/pathLabels.B [PathTabs.tsx, DeepDivePanel.tsx]
- [x] [Review][Patch] Duplicate React key risk in NarrativeBlock: key={driver} collides if drivers array contains the same driver name twice [NarrativeBlock.tsx]
- [x] [Review][Patch] Duplicate React key risk in timeline maps: key={entry.month} collides if timeline has two entries for the same month [DeepDivePanel.tsx]
- [x] [Review][Patch] Arrow key boundary: ArrowLeft on Tab A and ArrowRight on Tab B fire without e.preventDefault(), allowing default browser scrolling/focus escape [PathTabs.tsx:16-25]
- [x] [Review][Patch] Attribution dot test is brittle: getByText(...).parentElement traversal couples test to DOM structure; a wrapper div change silently breaks the assertion [DeepDivePanel.test.tsx:63-65]
- [x] [Review][Defer] Fixed element IDs in PathTabs (tab-path-a, panel-path-a, etc.) break ARIA if more than one PathTabs mounts in a page [PathTabs.tsx] — deferred, pre-existing
- [x] [Review][Defer] Home/End keyboard navigation not handled in PathTabs — ARIA authoring practices recommend it [PathTabs.tsx] — deferred, pre-existing
- [x] [Review][Defer] No null guard on AGENT_ROLES[viz_type] in getDriverSlotIndex — TypeScript VizType union enforces valid keys [DeepDivePanel.tsx] — deferred, pre-existing
- [x] [Review][Defer] No null guard on driver before toLowerCase() call — TypeScript string[] enforces non-null [DeepDivePanel.tsx] — deferred, pre-existing
- [x] [Review][Defer] DeepDiveStrip applies both manual 120-char truncation and line-clamp-4 — double truncation can interact awkwardly in edge layouts [DeepDiveStrip.tsx] — deferred, pre-existing
- [x] [Review][Defer] Score display hardcodes "/ 100" without clamping or validation — acceptable for current mock phase [DeepDiveStrip.tsx] — deferred, pre-existing
- [x] [Review][Defer] expect(() => render()).not.toThrow() is a weak guard — failures often surface as console errors rather than exceptions [DeepDivePanel.test.tsx] — deferred, pre-existing
- [x] [Review][Defer] MOCK_DEEP_DIVE_PROPS hardwired in ThinSliceDemo — no boundary between demo scaffolding and future real props integration [ThinSliceDemo.tsx] — deferred, by design for mock phase
- [x] [Review][Defer] No test for empty or missing synthesis.timeline — contract-compliant mock always non-empty, real data testing is future story concern [DeepDivePanel.test.tsx] — deferred, pre-existing
- [x] [Review][Defer] Integration test relies on dev-only stage select control — dev tooling is by design in this project [ThinSliceDemo.test.tsx] — deferred, pre-existing
- [x] [Review][Defer] SLOT_BG only covers 4 slots; a viz_type with >4 agent roles would silently show bg-text-dim [DeepDivePanel.tsx] — deferred, pre-existing
- [x] [Review][Defer] Attribution dots accessible only via HTML title — title on non-interactive elements is not reliably announced by all screen readers, but is within AC5 spec [NarrativeBlock.tsx] — deferred, in-spec

## Change Log

- 2026-03-25: Story 4.3 created — DeepDivePanel path tabs, narrative with attribution, compressed strips, dashboard→deepDive transition.
- 2026-03-25: Implementation complete — narrative components, ThinSliceDemo wiring, tests; status → review.
