# Story 7.1: Map-Only Viz + Madrid Distrito Data Overlay

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want to always see a rich geographic map with real distrito demographics for both paths,
So that I can visually compare how each decision plays out in my actual neighborhood.

## Acceptance Criteria

_trace: FR14 (geography-oriented depictions); Epic 7 Story 7.1; architecture MapView + Mapbox; UX map-only pivot_

1. **Given** any `viz_type` classification (map, flow, or network) **when** the simulation renders in running, dashboard, or deepDive stages **then** both side panels always show the map visualization — `VizRouter` routes all modes to MapScene.

2. **And** Path A map centers on a candidate location (Malasaña: lat 40.4276, lng -3.7038) and Path B centers on the existing location (Puerta del Sol: lat 40.4167, lng -3.7004), visually differentiating the two paths.

3. **And** a typed GeoJSON fixture exists at `src/lib/geo/madrid-distritos.ts` containing 21 Madrid distrito polygon features with properties: `name` (string), `population` (number), `avgIncome` (number, EUR/year), `commercialDensity` (number, businesses per km²), `area_km2` (number).

4. **And** MapScene renders a Mapbox `fill` layer sourced from the distrito GeoJSON, color-coded by `commercialDensity` using a blue gradient (higher density = more saturated blue).

5. **And** MapScene renders a Mapbox `line` layer for distrito boundaries (semi-transparent, ~0.5 opacity).

6. **And** `ModeBadge` continues showing the classified mode (map/flow/network) as informational context — it is NOT removed.

7. **And** existing map features (customer dots, competitor markers, cash flow ticker, heat overlay) continue to function.

8. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [ ] **Create Madrid distrito GeoJSON fixture** (AC: 3)
  - [ ] Create `src/lib/geo/madrid-distritos.ts` with typed GeoJSON FeatureCollection.
  - [ ] Fetch distrito boundary polygons from the community GeoJSON source: `https://github.com/codeforgermany/click_that_hood/blob/main/public/data/madrid-districts.geojson`
  - [ ] Enrich each feature's `properties` with approximate demographic data: `name`, `population`, `avgIncome`, `commercialDensity`, `area_km2`. Use curated approximate values from INE/Madrid open data — exact precision is not required for MVP.
  - [ ] Export typed interfaces: `DistritoProperties`, `DistritoFeature`, `DistritoFeatureCollection`.
  - [ ] Add a unit test (`src/lib/geo/madrid-distritos.test.ts`) verifying the fixture has 21 features and all required properties are present and numeric.

- [ ] **Add distrito overlay layers to MapScene** (AC: 4, 5, 7)
  - [ ] In `src/components/viz/MapView/MapScene.tsx`, import the distrito GeoJSON fixture.
  - [ ] Add a Mapbox `Source` with the distrito GeoJSON and two layers:
    - `fill` layer: color by `commercialDensity` using a `["interpolate", ["linear"], ["get", "commercialDensity"], ...]` paint expression with blue gradient.
    - `line` layer: distrito boundaries with stroke opacity ~0.5, stroke color matching theme border color.
  - [ ] Place distrito layers BELOW customer dots and competitor markers (layer ordering).
  - [ ] Ensure existing map features (customer dots, competitor markers, heat overlay, cash flow ticker) remain functional.

- [ ] **Differentiate Path A / Path B map centers** (AC: 2)
  - [ ] In `MapScene.tsx`, accept a `pathTone` prop: `"A" | "B"`.
  - [ ] Define two constants: `CENTER_A = { lng: -3.7038, lat: 40.4276 }` (Malasaña) and `CENTER_B = { lng: -3.7004, lat: 40.4167 }` (Sol).
  - [ ] Use `pathTone` to select the center: A → CENTER_A, B → CENTER_B.
  - [ ] Update `useMemo` dependency arrays that reference `CENTER` to use the new per-path constant.
  - [ ] In `MapHalf.tsx`, thread `pathTone` prop from parent to `MapScene`.

- [ ] **Wire map-only rendering in ThinSliceDemo** (AC: 1)
  - [ ] In `src/components/shell/ThinSliceDemo.tsx`, modify the **running** stage: always render `MapHalf` in both side panels (remove the `vizType === "map" ? <MapHalf> : <VizRouter>` conditional). Pass `pathTone="A"` to left, `pathTone="B"` to right.
  - [ ] In the **dashboard** stage: always render the map layout (currently only when `vizType === "map"`). Pass `pathTone` to the `VizMapSideCanvas` / `MapHalf` / `PathSummaryCard` branches.
  - [ ] In the **deepDive** stage: ensure `VizMapSideCanvas` always wraps content (it already does for map; keep that behavior for all modes).

- [ ] **Update VizRouter to always route to map** (AC: 1)
  - [ ] In `src/components/viz/VizRouter.tsx`, modify `VizRouterSwitch` so all cases render the map component. Keep the error boundary fallback to `FallbackViz`.
  - [ ] Do NOT delete Flow/Network/Fallback components — keep them in the codebase, just unreachable from the router switch.

- [ ] **Quality gates** (AC: 8)
  - [ ] Run `npm run test` — fix any broken tests from the routing change.
  - [ ] Run `npm run lint`.
  - [ ] Run `npm run build`.

## Dev Notes

### Architecture

This story pivots the visualization strategy: `viz_type` classification stays in the pipeline (needed for agent role selection via `AGENT_ROLES[viz_type]`) but no longer drives which viz component renders. The UI always shows the map. Flow/Network/Fallback components remain in the codebase for potential future use but are unreachable from `VizRouter`.

### Key files to modify

- `src/components/viz/MapView/MapScene.tsx` — main changes: pathTone prop, distrito GeoJSON layers, distinct centers
- `src/components/viz/MapView/MapHalf.tsx` — thread pathTone prop
- `src/components/shell/ThinSliceDemo.tsx` — always-map rendering in all stages
- `src/components/viz/VizRouter.tsx` — route all modes to map

### New files

- `src/lib/geo/madrid-distritos.ts` — typed GeoJSON + demographics fixture
- `src/lib/geo/madrid-distritos.test.ts` — fixture shape validation

### Files NOT to touch

- `src/lib/classifier.ts` — viz_type classification unchanged
- `src/lib/types.ts` — VizType union unchanged (keep "fallback" for error boundary)
- `src/components/viz/FlowView/` — keep all files, just unreachable
- `src/components/viz/NetworkView/` — keep all files, just unreachable
- `src/components/viz/FallbackViz.tsx` — keep for error boundary fallback
- `src/lib/agents.ts` — no changes in this story
- `src/app/api/simulate/` — no changes in this story

### Distrito data sourcing

Fetch the community GeoJSON from: https://github.com/codeforgermany/click_that_hood/blob/main/public/data/madrid-districts.geojson

This contains 21 distrito boundary polygons for Madrid. Manually enrich each feature's properties with approximate demographics. Acceptable approximate values for the 21 distritos:

- Centro: pop ~150k, income ~28k, commercial density ~450/km²
- Arganzuela: pop ~155k, income ~30k, commercial density ~280/km²
- Retiro: pop ~120k, income ~38k, commercial density ~200/km²
- Salamanca: pop ~145k, income ~48k, commercial density ~350/km²
- Chamartín: pop ~145k, income ~45k, commercial density ~300/km²
- Tetuán: pop ~155k, income ~27k, commercial density ~320/km²
- Chamberí: pop ~140k, income ~40k, commercial density ~380/km²
- Fuencarral-El Pardo: pop ~245k, income ~35k, commercial density ~80/km²
- Moncloa-Aravaca: pop ~120k, income ~42k, commercial density ~120/km²
- Latina: pop ~235k, income ~24k, commercial density ~180/km²
- Carabanchel: pop ~260k, income ~22k, commercial density ~170/km²
- Usera: pop ~140k, income ~20k, commercial density ~200/km²
- Puente de Vallecas: pop ~230k, income ~19k, commercial density ~190/km²
- Moratalaz: pop ~95k, income ~26k, commercial density ~130/km²
- Ciudad Lineal: pop ~215k, income ~28k, commercial density ~180/km²
- Hortaleza: pop ~190k, income ~34k, commercial density ~100/km²
- Villaverde: pop ~150k, income ~18k, commercial density ~120/km²
- Villa de Vallecas: pop ~110k, income ~22k, commercial density ~60/km²
- Vicálvaro: pop ~75k, income ~24k, commercial density ~50/km²
- San Blas-Canillejas: pop ~160k, income ~26k, commercial density ~90/km²
- Barajas: pop ~48k, income ~36k, commercial density ~40/km²

These are approximate — suitable for a demo visualization, not authoritative statistics.

### Testing notes

- MapScene Mapbox tests run in jsdom with mocked Mapbox components (existing pattern in project).
- Test that `pathTone="A"` uses CENTER_A and `pathTone="B"` uses CENTER_B.
- Test that distrito GeoJSON fixture has exactly 21 features with all required properties present and of correct types.
- Existing `ThinSliceDemo.test.tsx` tests for flow/network viz modes may need updating since VizRouter now always returns map.
- Existing `VizRouter.test.tsx` tests need updating for the new always-map behavior.

### Previous story intelligence

- Story 4.2 implemented MapView with react-map-gl, Mapbox dark-v11 style, customer dots, competitor markers, heat overlay, and cash flow ticker.
- Story 5.4 implemented NetworkView and FallbackViz — these remain in codebase but become unreachable.
- Story 3.4 implemented FlowView — remains in codebase but becomes unreachable.
- `VizMapSideCanvas` component wraps map canvases with appropriate layout — reuse it.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — §2 MapView, ADR-04 viz_type routing]
- [Source: `src/components/viz/MapView/MapScene.tsx` — existing map implementation]
- [Source: `src/components/viz/VizRouter.tsx` — existing viz routing]
- [Source: `src/components/shell/ThinSliceDemo.tsx` — shell stage rendering]

### Review Findings

- [x] [Review][Patch] **F1: Path A/B share same map center — Malasaña coordinates missing** — AC #2 requires Path A → Malasaña (40.4276, -3.7038) and Path B → Sol (40.4167, -3.7004). Add CENTER_A/CENTER_B constants; use pathTone to select default center when no submittedLocation is provided. [MapScene.tsx, ThinSliceDemo.tsx]
- [x] [Review][Dismiss] **F2: VizRouter orphaned from rendering path** — Accepted: direct MapHalf rendering is simpler; VizRouter update sufficient for AC compliance.
- [x] [Review][Patch] **F3: Grounding distribution summary removed from dashboard** — Restore grounding distribution info to PathSummaryCard. [ThinSliceDemo.tsx]
- [x] [Review][Patch] **F4: `CENTER` object defeats useMemo — fresh object every render** [MapScene.tsx:84-98]
- [x] [Review][Patch] **F5: Duplicate Mapbox Source IDs collide when `reuseMaps` enabled** [MapScene.tsx:236-298]
- [x] [Review][Patch] **F6: `stubReducedMotion` leaks across tests — no afterEach cleanup** [ThinSliceDemo.test.tsx:132-151]
- [x] [Review][Patch] **F7: `vizType` dead prop in VizMapSideCanvas — declared but never read** [VizMapSideCanvas.tsx:6]
- [x] [Review][Patch] **F8: Duplicate React keys when competitors share lat/lng** [MapScene.tsx:322]
- [x] [Review][Patch] **F9: Stale replay timeout fires after `resetToInput`** [ThinSliceDemo.tsx:398-413]
- [x] [Review][Patch] **F10: `MADRID_DISTRITOS as GeoJSON.FeatureCollection` unsafe downcast** [MapScene.tsx:236]
- [x] [Review][Defer] **F11: `insightsByPath` truncation silently removed** [ThinSliceDemo.tsx] — deferred, scope creep from refactor
- [x] [Review][Defer] **F12: MADRID_DISTRITOS inline GeoJSON in client bundle** [madrid-distritos.ts] — deferred, acceptable for MVP demo
- [x] [Review][Defer] **F13: `onLogoClick` button missing focus indicator** [ThinSliceDemo.tsx:464] — deferred, pre-existing from landing page story
- [x] [Review][Defer] **F14: Submit while competitor fetch in-flight** [InputWizard] — deferred, story 7.2 scope
- [x] [Review][Defer] **F15: Leaked promise on unmount in InputWizard** [InputWizard] — deferred, story 7.2 scope

## Change Log

- 2026-03-26: Story created — map-only viz pivot with Madrid distrito demographic overlay.
