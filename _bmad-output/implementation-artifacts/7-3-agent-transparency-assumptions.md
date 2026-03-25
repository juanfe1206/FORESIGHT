# Story 7.3: Agent Prompt Overhaul + Assumption Transparency

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a small business owner,
I want to see what the simulation agents assumed versus what I told them,
So that I understand why confidence varies and can trust the results more.

## Acceptance Criteria

_trace: FR28 (confidence/grounding signals); Epic 7 Story 7.3; architecture agent prompts; UX transparency_

1. **Given** enriched context from the wizard (business type, competitors, location, distrito demographics) **when** agents run **then** the agent system prompt instructs agents to distinguish supplied facts from assumed facts.

2. **And** each agent's JSON output includes an `assumptions` field: `string[]` — a list of assumptions the agent made when data was not supplied. Empty array when all key data was supplied.

3. **And** `AgentOutput` in `src/lib/types.ts` is extended with `assumptions?: string[]`.

4. **And** the agent system prompt references distrito demographics (population, income, commercial density) when the confirmed location is in Madrid — data imported from `src/lib/geo/madrid-distritos.ts` (created in Story 7.1).

5. **And** the agent system prompt references confirmed competitors by name when provided in the context.

6. **And** the agent system prompt instructs: confidence >= 0.8 only when key inputs for the role are supplied; lower when assumptions are needed.

7. **And** `normalizeAgentOutput` in `src/lib/agents.ts` parses the `assumptions` array from the LLM response. Missing or non-array `assumptions` defaults to empty array `[]`.

8. **And** `max_tokens` for agent calls is increased from 220 to 350 to accommodate the assumptions list.

9. **And** the deep dive panel (narrative section) shows each agent's assumptions as a bulleted list alongside their insight text. Supplied data items are visually distinct from assumed items.

10. **And** the classifier prompt in `src/lib/classifier.ts` includes the new context fields (businessType, employeeCount, productsOrServices, confirmedCompetitors) in the user prompt construction.

11. **And** `npm run test`, `npm run lint`, `npm run build` pass.

## Tasks / Subtasks

- [ ] **Extend AgentOutput type** (AC: 3)
  - [ ] In `src/lib/types.ts`, add `assumptions?: string[]` to the `AgentOutput` interface.

- [ ] **Rewrite agent system prompt** (AC: 1, 4, 5, 6)
  - [ ] In `src/lib/agents.ts`, replace `AGENT_SYSTEM_PROMPT` with a detailed prompt that:
    - Instructs agents to distinguish SUPPLIED vs ASSUMED facts.
    - Requires `assumptions: string[]` in the JSON output.
    - Sets confidence calibration rules (>= 0.8 only when key data is supplied).
    - References distrito demographics when available.
    - References confirmed competitors when available.
  - [ ] Update `buildUserPrompt` to include new context fields: `businessType`, `employeeCount`, `productsOrServices`, `confirmedCompetitors` (names and count), `confirmedLocation`.
  - [ ] When location matches Madrid, look up the nearest distrito from `src/lib/geo/madrid-distritos.ts` and include its stats (population, avgIncome, commercialDensity) in the prompt.

- [ ] **Update agent output parsing** (AC: 7, 8)
  - [ ] In `src/lib/agents.ts`, update `normalizeAgentOutput` to extract `assumptions` from the parsed JSON. If missing or not an array, default to `[]`. Filter non-string entries.
  - [ ] Increase `max_tokens` from 220 to 350 in the `executeAgentSlot` function.

- [ ] **Update classifier prompt** (AC: 10)
  - [ ] In `src/lib/classifier.ts`, update `buildUserPrompt` to include `businessType`, `employeeCount`, `productsOrServices`, and competitor count in the context block sent to the classifier LLM.

- [ ] **Show assumptions in deep dive UI** (AC: 9)
  - [ ] In the deep dive narrative component (likely `src/components/narrative/DeepDivePanel.tsx` or its children), when rendering agent insights, also render each agent's `assumptions` array as a bulleted sub-list below the insight.
  - [ ] Style assumptions with a distinct visual treatment: lighter/dimmer text, prefixed with "Assumed:" or an indicator icon.
  - [ ] If `assumptions` is empty or undefined, show nothing (no empty state needed).

- [ ] **Update tests** (AC: 11)
  - [ ] In `src/lib/agents.test.ts` (or `src/lib/classifier.test.ts`), update mock LLM responses to include `assumptions` field.
  - [ ] Test that `normalizeAgentOutput` correctly parses assumptions array.
  - [ ] Test that missing `assumptions` defaults to `[]`.
  - [ ] Test that non-array `assumptions` defaults to `[]`.
  - [ ] Update any snapshot or assertion tests affected by the prompt changes.

- [ ] **Quality gates** (AC: 11)
  - [ ] Run `npm run test`.
  - [ ] Run `npm run lint`.
  - [ ] Run `npm run build`.

## Dev Notes

### Revised agent system prompt

```
You are a business simulation agent analyzing a specific path of a decision.
You have real context about a small business.

CRITICAL: Distinguish between SUPPLIED facts (from user input) and ASSUMED facts (your estimates).

Return ONLY a JSON object with these keys:
- role: your assigned role (string)
- insight: 1-2 specific sentences grounded in available data (string)
- confidence: 0 to 1 — set >= 0.8 ONLY when all key inputs for your role are supplied; lower when you are assuming (number)
- grounding: "supplied" if all key data was given, "mixed" if some was assumed, "assumed" if mostly estimated (string)
- assumptions: list each specific assumption you made; empty array [] if all data was supplied (string[])

When distrito demographics are provided (population, income, commercial density), cite specific numbers in your insight.
When confirmed competitors are provided, reference them by name and consider their proximity.
When business type and revenue are provided, ground your estimates in those figures rather than generic industry averages.
```

### Distrito lookup logic

Import `MADRID_DISTRITOS` from `src/lib/geo/madrid-distritos.ts`. For MVP, use a simple approach: check if the location string contains "Madrid" (case-insensitive). If yes, find the distrito whose centroid is nearest to `confirmedLocation` coordinates (if available) or default to Centro. Include that distrito's stats in the user prompt.

A full point-in-polygon check is out of scope — nearest centroid is sufficient for demo.

### Key files to modify

- `src/lib/types.ts` — add `assumptions` to AgentOutput
- `src/lib/agents.ts` — system prompt, user prompt, normalizeAgentOutput, max_tokens
- `src/lib/classifier.ts` — include new context fields in buildUserPrompt
- Deep dive narrative component (`src/components/narrative/`)

### Files NOT to touch

- `src/app/api/simulate/route.ts` — no changes needed; assumptions flow through existing AgentOutput
- `src/components/shell/ThinSliceDemo.tsx` — no changes needed; already passes all data through
- `src/components/agents/AgentHUD.tsx` — optional enhancement, not required for this story
- `src/lib/demo-scenarios.ts` — already updated in Story 7.2

### Testing notes

- Mock OpenAI responses to include `assumptions` array in agent output.
- Test `normalizeAgentOutput` edge cases: missing field, null, non-array, array with non-strings.
- Classifier tests: verify new fields appear in the user prompt string.
- Deep dive UI: test that assumptions render when present and don't render when empty.

### Previous story intelligence

- Story 6.3 implemented grounding distribution summaries and trust framing — this story enhances that with explicit assumption lists.
- Story 2.3 implemented parallel agent execution — prompt and parsing changes here are additive.
- `normalizeAgentOutput` already handles `grounding` normalization — follow the same defensive pattern for `assumptions`.
- Agent tests in `src/lib/classifier.test.ts` mock OpenAI; follow the same `vi.hoisted` + `vi.mock` pattern.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 7, Story 7.3]
- [Source: `src/lib/agents.ts` — current agent implementation]
- [Source: `src/lib/classifier.ts` — current classifier implementation]
- [Source: `src/lib/types.ts` — AgentOutput interface]
- [Source: `src/components/narrative/` — deep dive panel components]
- [Source: `src/lib/geo/madrid-distritos.ts` — distrito fixture (Story 7.1)]

## Change Log

- 2026-03-26: Story created — agent prompt overhaul with structured assumptions and deep dive transparency.
