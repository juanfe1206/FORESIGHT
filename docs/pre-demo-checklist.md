# Story 6.4 Pre-Demo Checklist

Owner: ____________________________

Date: ____________________________

Scenario IDs (fixed)
- Demo 1 (Map): `demo-map-v1`
- Demo 2 (Flow): `demo-flow-v1`
- Demo 3 (Network -> controlled fallback): `demo-network-v1`

Script reference: `docs/demo-script.md`
- Demo 1 section: Map
- Demo 2 section: Flow
- Demo 3 section: Network (controlled fallback)

## Checklist (checkboxes required)

- [ ] Cached replay path exercised at least once end-to-end
  - Procedure: run a scenario while live API fails, verify the UI shows the replay/fallback shell and the FR29 banner reads as a saved simulation.
  - Evidence: confirm `runStatus` becomes `fallback` and the dashboard is visible (no input dead-end).

- [ ] `FallbackViz` exercised in a controlled degraded case
  - Procedure: run Demo 3 with scenario ID `demo-network-v1` (network classification is forced, then the server forces a deterministic timeout in non-production).
  - Evidence: side panels render `FallbackViz` (diamond layout) and the dashboard remains present for KPI comparison continuity.

- [ ] Projector/readability contrast spot-check on dark theme surfaces
  - Procedure: confirm text labels/icons remain legible for Mode badge + KPI headers + fallback diamond labels under the expected projector brightness.
  - Evidence: at least one manual “can read from the back of the room” check completed.

- [ ] Screenshot backup captured for all three scenarios
  - Required captures:
    - Map: `demo-map-v1`
    - Flow: `demo-flow-v1`
    - Network/Fallback: `demo-network-v1`

