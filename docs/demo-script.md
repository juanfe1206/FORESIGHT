# Story 6.4 Demo Script (~60 seconds)

This is a rehearsal script for the three canned inputs used in Story 6.4.

Scenario IDs (fixed)
- Demo 1 (Map): `demo-map-v1`
- Demo 2 (Flow): `demo-flow-v1`
- Demo 3 (Network -> controlled fallback): `demo-network-v1`

Non-advice framing line (use as written)
- For live/demo runs: `Outputs shown are simulated consequences from your inputs. They are not guaranteed forecasts, personalized professional advice, or promises of outcomes.`
- For replay/fallback runs: `Outputs shown are simulated consequences from a saved simulation. They are not guaranteed forecasts, personalized professional advice, or promises of outcomes.`

## Demo 1 — Map (`demo-map-v1`)

1. Problem framing: “I need a place-based choice—where should we invest so customers can actually reach us?”
2. Start simulation: “I’m running the simulation on this map scenario now.”
3. Parallel agent visibility: “You’ll see both paths’ agents working in parallel—filling in assumptions and reasoning as they go.”
4. Mode adaptation: “This is classified as Map mode, so the side panels present the place/local view.”
5. KPI comparison: “Now we compare the two paths’ KPIs side-by-side to see which outcome pattern scores better overall.”
6. One key tradeoff: “The tradeoff to call out is speed versus reach: faster local traction can still cap longer-horizon expansion.”
7. Close: “That’s the map demo—decisions here are simulated consequences, not guaranteed outcomes.”

### 30-second compressed variant

“We’re choosing a place-based investment. Running the simulation now. Agents fill in both paths in parallel. Classified as Map mode. KPIs compare side-by-side. Tradeoff: speed versus reach. Remember: simulated consequences, not guaranteed outcomes.”

## Demo 2 — Flow (`demo-flow-v1`)

1. Problem framing: “Now the decision is about resources—budgeting and timing—so it’s a flow-style planning question.”
2. Start simulation: “Running the flow scenario simulation.”
3. Parallel agent visibility: “Again, both paths’ agents progress in parallel so we can compare the reasoning, not just the result.”
4. Mode adaptation: “We adapt into Flow mode, where the panels focus on allocation and planning dynamics.”
5. KPI comparison: “KPI comparison shows which path pattern scores higher overall.”
6. One key tradeoff: “Tradeoff: earlier spending can reduce uncertainty later, but may increase near-term risk.”
7. Close: “And as always: simulated consequences from your inputs—not guaranteed forecasts.”

### 30-second compressed variant

“This is a resources-and-timing decision. Running the flow scenario. Agents work in parallel. Flow mode adapts the view. We compare KPIs side-by-side. Tradeoff: spend now versus risk later. Remember: simulated consequences, not guaranteed forecasts.”

## Demo 3 — Network (controlled fallback) (`demo-network-v1`)

This demo is intentionally staged to exercise graceful degradation:
- We classify the decision as Network.
- In non-production, the server forces a deterministic timeout after classification so the shell replays cached/golden results and shows `FallbackViz`.

1. Problem framing: “This is a relationships/ecosystem decision—partnership and stakeholder dynamics.”
2. Start simulation: “Running the network demo input now.”
3. Parallel agent visibility: “You’ll still see both paths’ agents behave up to the transition point, then the shell degrades gracefully.”
4. Mode adaptation: “Although the decision is classified as Network, the rehearsal forces a timeout so the shell shows the fallback visualization.”
5. KPI comparison: “With fallback displayed, we still keep the KPI comparison context on the dashboard so the story doesn’t dead-end.”
6. One key tradeoff: “Tradeoff to mention: network upside can depend on coordination reliability, so the demo rehearses what happens when providers don’t respond in time.”
7. Close: “Outputs shown are simulated consequences from a saved simulation—not guaranteed forecasts—so we can rehearse under pressure.”

### 30-second compressed variant

“This is a relationships/ecosystem decision. Running the network demo. It’s classified as Network, but the rehearsal forces a controlled timeout. The shell replays and shows fallback visualization so we can keep presenting. KPIs still compare. Tradeoff: network upside depends on coordination reliability. Simulated consequences from a saved simulation—no guaranteed forecasts.”

