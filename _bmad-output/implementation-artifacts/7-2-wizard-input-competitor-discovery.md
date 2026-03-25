# Story 7.2: 4-Step Wizard Input + Live Competitor Discovery

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want a guided step-by-step input flow that confirms my location and shows real competitors found nearby,
So that the simulation is grounded in my actual business context.

## Acceptance Criteria

_trace: FR1, FR2; Epic 7 Story 7.2; architecture input wizard + OSM Overpass; UX guided onboarding_

1. **Given** the user is on the input screen **when** they begin **then** a 4-step wizard is shown with a progress indicator (step dots at top), replacing the single-page `DecisionForm`.

2. **Step 1 — Decision:** decision textarea (existing field, same validation: non-empty, max 2000 chars), "Next" button. Same `SimulationFramingBanner` at the bottom.

3. **Step 2 — Business details:** business type dropdown (options: bakery, cafe, restaurant, retail, services, other), employee count (number input), products or services (short text input), monthly revenue (existing field), location (existing field), customer base (existing field). "Next" button, "Back" button.

4. **Step 3 — Confirm location:** displays "Your location: [location text from step 2]" as a confirmation card. Location is editable (text input). "Confirm location" button advances. "Back" button.

5. **Step 4 — Confirm competitors:** shows a list of 3-5 nearby businesses fetched from OpenStreetMap Overpass API based on the business type from step 2 and the location from step 3. Each entry shows business name and type. A single "Run Simulation" CTA button to confirm and launch. "Back" button. If Overpass call fails or returns 0 results, show a message "No competitors found nearby — the simulation will proceed without competitor data" and the CTA remains enabled.

6. **And** each step slides left via Framer Motion `AnimatePresence` when advancing and slides right when going back. Respect `prefers-reduced-motion`.

7. **And** the final submission payload includes all wizard data in `SimulationRequest`: `decision`, `context` (with new fields: `businessType`, `employeeCount`, `productsOrServices`, `confirmedCompetitors`, `confirmedLocation`), and existing fields (`industry`, `monthlyRevenue`, `location`, `customerBase`, `details`).

8. **And** `SimulationRequest.context` in `src/lib/types.ts` is extended with: `businessType?: string`, `employeeCount?: number`, `productsOrServices?: string`, `confirmedCompetitors?: Array<{ name: string; lat: number; lng: number }>`, `confirmedLocation?: { lat: number; lng: number }`.

9. **And** the Overpass API call in `src/lib/overpass.ts` has a 5-second timeout (`AbortSignal.timeout(5000)`) and gracefully returns an empty array on failure.

10. **And** demo scenario buttons (dev-only) preload all 4 wizard steps with enriched data and skip to step 4 (or allow stepping through).

11. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [ ] **Create Overpass API wrapper** (AC: 5, 9)
  - [ ] Create `src/lib/overpass.ts` with typed function `fetchNearbyCompetitors(businessType: string, lat: number, lng: number, radiusM?: number): Promise<NearbyBusiness[]>`.
  - [ ] Map business type to OSM tags: bakery→`amenity=bakery`, cafe→`amenity=cafe`, restaurant→`amenity=restaurant`, retail→`shop=convenience`, services→`office=*`, other→`amenity=*`.
  - [ ] Use `https://overpass-api.de/api/interpreter` endpoint with `[out:json]` format.
  - [ ] Limit results to 5 (`out body 5;`).
  - [ ] 5-second `AbortSignal.timeout`. On error or timeout, return empty array.
  - [ ] Parse response: extract `elements[].tags.name`, `elements[].lat`, `elements[].lon`.
  - [ ] Add `src/lib/overpass.test.ts` with mocked fetch: success case, timeout case, empty results case.

- [ ] **Extend SimulationRequest context types** (AC: 8)
  - [ ] In `src/lib/types.ts`, add to `SimulationRequest.context`: `businessType?: string`, `employeeCount?: number`, `productsOrServices?: string`, `confirmedCompetitors?: Array<{ name: string; lat: number; lng: number }>`, `confirmedLocation?: { lat: number; lng: number }`.

- [ ] **Create InputWizard component** (AC: 1, 2, 3, 4, 6)
  - [ ] Create `src/components/input/InputWizard.tsx` — 4-step state machine.
  - [ ] Step indicator: row of 4 dots at top, active step highlighted with accent color.
  - [ ] Step transitions: Framer Motion `AnimatePresence` with slide-left (forward) / slide-right (back). Respect reduced motion.
  - [ ] Step 1: Decision textarea + SimulationFramingBanner + "Next" button. Same validation as current DecisionForm.
  - [ ] Step 2: Business details fields + "Back" / "Next" buttons. Reuse styling from existing `ContextFields` where possible.
  - [ ] Step 3: Location confirmation card + editable location field + "Back" / "Confirm location" buttons.
  - [ ] Step 4: Competitor list (loaded from Overpass) + "Back" / "Run Simulation" GlowButton.
  - [ ] Export `InputWizardState` type covering all fields across steps.

- [ ] **Create CompetitorConfirmStep component** (AC: 5)
  - [ ] Create `src/components/input/CompetitorConfirmStep.tsx`.
  - [ ] Accepts `competitors: NearbyBusiness[]`, `loading: boolean`, `error: boolean`.
  - [ ] Renders a list of competitor names. If empty + no error: "No competitors found nearby."
  - [ ] If loading: "Finding nearby competitors..."
  - [ ] CTA: `GlowButton` with "Run Simulation" label.

- [ ] **Validate new context fields** (AC: 7, 8)
  - [ ] In `src/app/api/simulate/validate.ts`, add validation for new fields: `businessType` (string, max 50), `employeeCount` (number >= 0), `productsOrServices` (string, max 500), `confirmedCompetitors` (array of objects with name/lat/lng), `confirmedLocation` (object with lat/lng numbers).

- [ ] **Wire InputWizard into ThinSliceDemo** (AC: 1, 7, 10)
  - [ ] In `src/components/shell/ThinSliceDemo.tsx`, replace `<DecisionForm>` with `<InputWizard>` in the input stage.
  - [ ] Wire `onValidSubmit` to include all wizard data in the simulation request.
  - [ ] Pass confirmed competitors to `MapScene` via props (for rendering as markers on the map).
  - [ ] Update `activeDemoScenarioId` handling: demo buttons preload all wizard fields.

- [ ] **Update demo scenarios** (AC: 10)
  - [ ] In `src/lib/demo-scenarios.ts`, extend `DemoScenario` type with new fields: `businessType`, `employeeCount`, `productsOrServices`.
  - [ ] Update all three scenarios with enriched data (e.g., demo-map-v1: businessType "bakery", employeeCount 4, productsOrServices "Artisan bread, pastries, coffee").
  - [ ] Add hardcoded `confirmedCompetitors` to each demo scenario for consistent rehearsal.

- [ ] **Quality gates** (AC: 11)
  - [ ] Run `npm run test` — update existing `ThinSliceDemo.test.tsx` tests that reference `DecisionForm` to work with `InputWizard`.
  - [ ] Run `npm run lint`.
  - [ ] Run `npm run build`.

## Dev Notes

### Overpass API

The Overpass API is free, requires no API key, and is rate-limited to ~2 req/sec (fine for demo use).

Example query for bakeries within 1.5km of Madrid centro:
```
https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="bakery"](around:1500,40.4167,-3.7004);out body 5;
```

Response shape:
```json
{
  "elements": [
    {
      "type": "node",
      "id": 123456,
      "lat": 40.4180,
      "lon": -3.6995,
      "tags": {
        "name": "Panadería La Mallorquina",
        "amenity": "bakery"
      }
    }
  ]
}
```

Business type to OSM tag mapping:
- bakery → `"amenity"="bakery"`
- cafe → `"amenity"="cafe"`
- restaurant → `"amenity"="restaurant"`
- retail → `"shop"="convenience"` (or `"shop"="supermarket"`)
- services → `"office"`
- other → `"amenity"` (broad)

### Key files to modify

- `src/lib/types.ts` — extend context shape
- `src/app/api/simulate/validate.ts` — validate new fields
- `src/components/shell/ThinSliceDemo.tsx` — swap DecisionForm for InputWizard, pass competitors to map
- `src/lib/demo-scenarios.ts` — enriched demo data
- `src/components/input/ContextFields.tsx` — may be reused inside wizard Step 2 for existing fields

### New files

- `src/lib/overpass.ts` — Overpass API client
- `src/lib/overpass.test.ts` — Overpass tests
- `src/components/input/InputWizard.tsx` — wizard component
- `src/components/input/CompetitorConfirmStep.tsx` — step 4 competitor confirmation

### Files NOT to touch

- `src/app/api/simulate/route.ts` — no server-side Overpass; competitors arrive via request context
- `src/lib/classifier.ts` — receives enriched context but no structural changes needed in this story
- `src/lib/agents.ts` — prompt changes are Story 7.3
- `src/components/viz/MapView/MapScene.tsx` — receives competitors as props; the marker rendering change is minimal (replace `COMPETITOR_OFFSETS` with real data when available)

### Competitor rendering in MapScene

When `confirmedCompetitors` is passed as a prop to MapScene (via MapHalf → ThinSliceDemo), render them as named Mapbox `Marker` components instead of the current random-offset `COMPETITOR_OFFSETS`. Fall back to the existing random offsets when no confirmed competitors are provided (backward compatibility).

### Form state management

The wizard manages its own step state internally. The parent (`ThinSliceDemo`) receives the complete payload only on final submission via `onValidSubmit`. The demo scenario buttons set all wizard fields at once and can optionally advance to step 4.

### Testing notes

- Mock `fetch` globally for Overpass API calls in tests.
- Test wizard step navigation: forward, backward, validation blocking advance.
- Test that final submission payload includes all fields from all steps.
- Test timeout/error fallback: Overpass failure should not block submission.
- Existing `ThinSliceDemo.test.tsx` tests reference `DecisionForm` — update to find wizard elements instead.

### Previous story intelligence

- Story 3.1 implemented DecisionForm and ContextFields — the wizard reuses field styling and validation patterns.
- Story 3.2 implemented GlowButton and submit wiring — reuse GlowButton for wizard CTAs.
- Story 6.4 implemented demo scenario buttons — update them to work with wizard state.
- `DecisionForm` and `ContextFields` components remain in codebase but `DecisionForm` is no longer mounted in ThinSliceDemo.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.2]
- [Source: `src/components/input/DecisionForm.tsx` — current form implementation]
- [Source: `src/components/input/ContextFields.tsx` — current context fields]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — shell input stage]
- [Source: `src/lib/demo-scenarios.ts` — demo scenario definitions]

## Change Log

- 2026-03-26: Story created — 4-step wizard input with live OpenStreetMap competitor discovery.
