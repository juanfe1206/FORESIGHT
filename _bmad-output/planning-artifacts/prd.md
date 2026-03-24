---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - foresight-master-spec.docx
  - planning-artifacts/_extracted-foresight-master-spec.md
  - brainstorming/brainstorming-session-2026-03-24-194934.md
  - docs/DEPLOYMENT.md
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 1
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
workflowType: prd
---

# Product Requirements Document - FORESIGHT

**Author:** Phillip
**Date:** March 24, 2026

## Executive Summary

FORESIGHT is a browser-based **visual A/B decision simulator** for **small business owners** who make many daily choices with incomplete information and without advisors or a data team. The user enters a concrete either/or decision and short business context; the product runs **two parallel simulations** (Path A vs Path B) in real time on a **split screen**. Four **independent** LLM-backed agents model stakeholder dimensions per path (roles adapt by decision type), then results collapse into a **comparative dashboard** (KPIs, scores, narrative) and an optional **deep dive** with month-by-month story. Positioning: **"See what happens before you decide"**—surface **simulated consequences**, not prescriptive advice. Hackathon alignment: reduce **decision anxiety** ("make someone's day easier") by replacing gut-only calls with a **simulation-first** experience.

**Build reference:** Four UI states; classifier-selected **Map / Flow / Network**; hybrid grounding (form context + model knowledge) with user-vs-assumption confidence called out in FR28 and the master spec. **Orchestration counts, stack, and timing** live in Success Criteria, Web Application Specific Requirements, and NFRs so this summary stays vision-first.

### What Makes This Special

- **Multi-agent, isolated:** Four agents per path do not see each other's outputs; outcomes are **emergent**, not a single chat pass labeled optimistic/pessimistic.
- **Visual-first product:** The simulation (animated HUD, mode-specific canvases, transitions) **is** the interface—not a chat transcript with optional charts.
- **Adaptive visualization:** Classifier chooses **Map** (geo/foot traffic/local market), **Flow** (budget/resources/time), or **Network** (partnerships/stakeholders); fallback viz if a mode is not ready.
- **A/B framing:** Side-by-side paths with panel headers using the **user's wording**, not generic "Scenario A/B."
- **Credible failure posture (spec):** Cached API response, FallbackViz, and demo scripts for three scenarios (Map / Flow / Network) to protect judges and live demos.

## Project Classification

| Dimension | Value |
|-----------|--------|
| **Project type** | **Web application** — SPA-style, multi-state UX, serverless API routes, rich client animation and mapping. |
| **Domain** | **General / SMB operations** — decision support and simulation UX; not a regulated vertical (healthcare, fintech, etc.) in the master spec. |
| **Complexity** | **Low** regulatory/compliance surface at product level; **elevated technical complexity** (parallel LLM orchestration, streaming/polling, three viz families, strict UI timing). |
| **Project context** | **Brownfield repository** (existing app/repo, deployment and branching documented); **greenfield product behavior** as defined by the consolidated master build specification (single source of truth for the hackathon build). |

## Success Criteria

### User Success

- A small-business user can enter an **either/or decision** plus **≤5 context fields** and launch a simulation with one clear CTA (**"Simulate My Decision"**).
- Within **~8–12 seconds** (aligned to intended API pacing), the user sees **Path A vs Path B** with **their own labels** in panel headers, a **live Agent HUD** (four agents progressing dormant → thinking → insight → complete), and **side-by-side adaptive viz** with a visible **mode badge** (Map / Flow / Network).
- After the run, the user gets a **comparable dashboard**: six **KPI cards** (revenue impact, risk, customer impact, operating costs, competitive exposure, what you'd miss), **winner cues**, and **per-path score rings**—without needing to read a chat wall.
- The user can open **Deep Dive** and scan a **tabbed narrative** (Path A / Path B) with **agent attribution** (colored dots), understanding *why* each path diverges at a glance.
- **Emotional bar:** the experience reads as **"I saw what might happen"** (consequence visibility), not **"an AI told me what to do."**

### Business Success

- **Hackathon / judge outcomes:** Deliver a **≤60s demo** that hits **problem → simulate → parallel agents → KPI comparison → adaptive mode** (script in master spec).
- **Proof of differentiation:** Live or cached run shows **three prepared scenarios**, each **forcing a different `viz_type`** (Map, Flow, Network), proving the classifier + adaptive UI—not a single fixed chart template.
- **Monetization story (as spec'd for pitch):** Clear line on **freemium** (e.g. **3 free decisions/month**, then subscription) for investor-facing slides; no requirement to implement billing in the hackathon slice.

### Technical Success

- **End-to-end orchestration:** `POST /api/simulate` performs **parse + classify**, **8 parallel agent calls** (4 agents × 2 paths), **2 synthesis calls**, and returns structured payloads including **`viz_type`** and per-path agent + synthesis outputs (spec target **~11 LLM calls** per decision; **~5–8s** latency where achievable).
- **Client integration:** Frontend progresses through **four screen states** (input → running → dashboard → deep dive) with specified **Framer Motion** transitions; simulation updates via **SSE or polling** as implemented.
- **Resilience:** **Cached full JSON response** (e.g. `localStorage` or static fixture) restores **Map + Flow + Network animations** if the live API fails; **`FallbackViz`** works for any decision if a mode is incomplete.
- **Cost awareness:** Per-run cost stays within the spec's order of magnitude (**~€0.10–0.30** per decision at intended model/tier choices), debatable in implementation but **not silently unbounded**.

### Measurable Outcomes

| Outcome | Signal |
|--------|--------|
| Core loop complete | One real decision runs **input → HUD + dual viz → KPIs → optional deep dive** without manual patching. |
| Classifier correct | **Demo 1 → MAP**, **Demo 2 → FLOW**, **Demo 3 → NETWORK** (per spec scenarios). |
| Performance feel | Simulation phase **≤12s** perceived wait; dashboard numbers use **count-up / stagger** per spec. |
| Demo safety | Offline/cached path + **FallbackViz** verified once before presentation. |
| Build quality | **`npm run build`** passes on the integration branch before merge/deploy (per repo norms). |

## Product Scope

### MVP strategy & resources

**MVP approach:** **Experience MVP** for the hackathon—prove **simulation-as-product** and **adaptive visualization** for judges; not billing or multi-tenant ops. Minimum lovable: **credible dual-path run**, **readable KPI comparison**, and **one rehearsed narrative** covering **multi-agent + A/B + mode switch**.

**Resources (master spec):** **Four developers**, **~10-hour** integration-aware schedule; **€200 Cursor** context; **~€0.10–0.30**/decision API envelope. Roles map to the master component tree; an **integration owner** (spec: Dev 2 afternoon) keeps the **state machine** from fragmenting.

### MVP — hackathon slice

**Journeys in scope:** **J1** Map (Demo 1 bakery), **J2** Flow (Demo 2 oven vs social), **J4** cache/API failure so **J6** presenter can finish offline, **J5** same **`POST /api/simulate`** contract as the UI (fixtures/tests)—no separate public API product.

**Must-have capabilities**

- **State 1–3:** **DecisionForm**, **ContextFields**, **GlowButton**, dark shell + design tokens; **SimulationContainer**, **PanelHeader**, **ModeBadge**, **VizRouter** with **MapView + FlowView** polished and **NetworkView** or **FallbackViz** per time budget (spec: **two polished modes + fallback** beats three broken modes).
- **Agent HUD + KPI stack:** **AgentHUD**, **KPICard**, **ScoreRing**, **WinnerBadge**; transitions per spec timing.
- **Backend:** Parse/classify; **8 parallel agent calls** + **2 syntheses**; return **`viz_type`** (maps to **visualization category** in FR5/FR12) + structured payload; **hybrid grounding** from form fields.
- **Resilience:** **Golden cached response** + **FallbackViz**; optional honest **replay** labeling.
- **Demo kit:** **Three** canned scenarios, **60s** script, **contrast** check, screenshot backup.

### Growth features (post-MVP)

- **Network** parity with Map/Flow; **Google Places** competitors where useful; **SSE** polish, error UX, telemetry, **auth**, persisted history, **quota**/freemium enforcement.

### Vision (future)

- **Multi-tenant SaaS**, richer **data grounding** (CRM, accounting, ads APIs), **outcome calibration**, team workspaces, industry packs—beyond the one-day master spec.

### Delivery risks & mitigations

| Risk | Mitigation |
|------|------------|
| **Technical** — triple-viz schedule | **Map + Flow** first; **Network** or **FallbackViz**; **cache** one full response. |
| **Technical** — orchestration bugs | Shared **`types`**, single **orchestrator**; integrate **early** in the day. |
| **Market / judge** — "just ChatGPT" | **Parallel isolated agents**, **side-by-side viz**, **classifier**; run **three** scenarios. |
| **Resource** — time lost | Drop **Network** Demo 3 first; **two modes + fallback**; **screenshot** deck last resort. |

## User Journeys

### Journey 1: Primary user — "See both futures" (Map / happy path)

**Who:** Elena runs a small bakery in Malasaña, Madrid (~€3K/mo revenue, ~200 regulars, foot-traffic heavy). She is torn between **€500 Instagram ads** vs **a cross-promo with Café Central**.

**Opening:** She is stuck in **decision anxiety**—both options feel plausible; she has no analyst and no time for spreadsheets.

**Rising action:** She opens Foresight, enters the decision in her own words, fills **industry, revenue, location, customer base, details**, and taps **Simulate My Decision**. The UI shifts to the **three-panel** run: her **exact path labels** appear on left/right; the **mode badge** reads **Map**; the center **Agent HUD** wakes four agents in sequence.

**Climax:** She watches **customers, competitors, market, cash** evolve **in parallel for A and B**—not a blob of chat—until **KPI cards** and **score rings** make the tradeoff scannable. She says: "I *saw* what each path does."

**Resolution:** She opens **Deep Dive** to read the **tabbed narrative** with **agent-colored dots**, then either decides, sleeps on it, or runs another decision another day. Emotional shift: **anxiety → informed tension** (still her choice).

**Failure / recovery:** If the map or API stutters, she should still leave with **KPIs + narrative** once the run completes, or trigger **cached / fallback** behavior without losing the story (per spec).

### Journey 2: Primary user — Resource tradeoff (Flow / happy path)

**Who:** Same bakery; Elena now asks whether to **spend €2K upgrading the oven** vs **hiring part-time social help** (production cap ~80 pastries/day, weak social presence).

**Opening:** Capital is scarce; the "right" answer depends on **how budget and time flow** through the business.

**Rising action:** Same input flow; classifier selects **Flow**. Side panels show **pools, pipes, particles**—"money/time flowing" matches how she thinks about the bet.

**Climax:** KPI comparison clarifies **risk, costs, customer impact** in **her framing**, not abstract jargon.

**Resolution:** She can explain the tradeoff to a partner or lender using **the dashboard**, not gut alone.

### Journey 3: Primary user — Partnerships / Network (happy path or FallbackViz)

**Who:** Elena considers **joining a local business association with shared delivery** vs **staying independent** (€400/mo solo delivery vs €100/mo association fee in spec).

**Opening:** The decision is **relational**—stakeholders, trust, and dependencies—not a single map pin.

**Rising action:** Classifier selects **Network**; nodes and **relationship lines** animate as agents fire. If Network mode is not ready, **FallbackViz** still carries the **HUD → KPI** story without breaking the demo.

**Climax:** She grasps **who pulls toward / away** from her business under each path.

**Resolution:** She can negotiate or exit the association conversation with a **shared picture**, not vibes only.

### Journey 4: Primary user — Edge case (live API fails)

**Who:** Elena on spotty Wi‑Fi right before a pitch or judge demo.

**Opening:** She taps **Simulate**; the network drops or the LLM errors mid-run.

**Rising action:** The app does **not** dead-end—**cached JSON** (or last **golden** response) **plays the same animations** and lands on **Results**, with honest labeling if you choose to surface "offline replay" in copy.

**Climax:** She (or a presenter) still completes **the 60s script** with visuals.

**Resolution:** Trust in the **product ritual** survives a bad network day; judges see a deliberate fallback, not a blank screen.

### Journey 5: API / integration consumer (developer)

**Who:** A teammate or future integrator wiring the **web UI** or an internal tool to **`POST /api/simulate`**.

**Opening:** They need **stable JSON**: parsed paths, **`viz_type`**, per-path **agent outputs + synthesis**.

**Rising action:** They call the route with the same **context envelope** the form collects; they handle **parallel completion**, optional **SSE/polling**, and **typing** from **`lib/types`**.

**Climax:** A second client (or test harness) can **replay** responses for CI or demos.

**Resolution:** Frontend and future services share **one contract**, not ad-hoc prompt strings in the browser.

### Journey 6: Operator / presenter (hackathon demo & ops)

**Who:** A team member running the **60-second judge script**—possibly switching among **Demo 1 / 2 / 3** to prove **classifier → mode** routing.

**Opening:** They need **predictable mode switches** and **contrast-safe** dark UI on a projector.

**Rising action:** They preload **three exact prompts** + context, rehearse **Input → Simulation → Dashboard → (optional) second mode**, and confirm **cached** path works.

**Climax:** Judges hear **problem / multi-agent / comparison / adaptivity** in one minute, with **KPIs** on screen.

**Resolution:** Demo risk is **managed** (fallbacks, screenshot backup per spec), not "hope the API smiles."

*Full SaaS **admin**, **billing**, and **support ticket** journeys are **out of scope** for the hackathon slice; they belong under Growth / Vision.*

### Journey Requirements Summary

| Journey | Capabilities implied |
|--------|----------------------|
| 1–3 (primary paths) | **Decision + context** capture; **classifier**; **Map / Flow / Network** (or **FallbackViz**); **Agent HUD** choreography; **KPI + score ring** dashboard; **Deep Dive** narrative + tabs; **design tokens** for readability. |
| 4 (API failure) | **Resilient orchestration**, **cached / golden** response path, non-blocking transition to **Results**; optional user-facing **honest recovery** copy. |
| 5 (API consumer) | **`POST /api/simulate`** contract, **typed** responses, **8+2** LLM orchestration, env/config for models/keys, test/replay hooks. |
| 6 (presenter) | **Three canned scenarios**; **mode badge** correctness; **build + deploy** discipline (`docs/DEPLOYMENT.md`); **contrast** check for **dark theme** on projector. |

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Isolated multi-agent simulation:** Four agents per path predict **without seeing each other's outputs**, so combined results read as **emergent** rather than a single model doing "optimistic vs pessimistic."
- **Visual-first A/B frame:** The product is **split-screen consequence theater** (HUD + dual canvases + KPI landing), not chat-with-charts bolted on.
- **Adaptive visualization:** One natural-language decision fans out into **Map / Flow / Network** (plus **FallbackViz**) via a **classifier**, so the metaphor matches the decision topology.
- **Hybrid grounding + confidence:** Business context from the form is **injected everywhere**; **confidence** communicates **user-grounded vs assumed** content—aligns with transparency expectations for LLM output.

### Market Context & Competitive Landscape

- **Vs. general chat:** The master spec positions against **single-pass ChatGPT**: no multi-agent isolation, no mandated visual simulation, no automatic viz-mode choice, weaker default **A/B** framing (see section 1.3).
- **Hackathon narrative:** Pitch materials already segment **VC** (TAM, architecture, freemium), **technical** (parallel agents, emergent behavior, adaptive UI), and **UX** (simulation-as-product, contextual viz, four states) judges—use that as the competitive story without claiming regulated-domain moats.

### Validation Approach

- **Scenario matrix:** **Three canned demos** must each exercise a different **`viz_type`** (Map, Flow, Network) with stable copy—primary proof the classifier + UX are real.
- **Technical validation:** **11-call orchestration** per decision (parse/classify + 8 agents + 2 syntheses), with **measurable latency** in the **5–12s** band the UI promises.
- **Resilience validation:** **Cached "golden" JSON** and **FallbackViz** exercised in rehearsal so "failure" demos still complete the story.

### Risk Mitigation

- **Innovation risk:** Multi-agent + triple viz is **schedule-heavy**—spec **prioritizes two polished modes + fallback** over three brittle modes.
- **Credibility risk:** Outputs are **simulations**, not forecasts—product and pitch should avoid **advice** framing; emphasize **"see what happens"** and **confidence/limitations**.
- **Judge/demo risk:** **60s script**, **contrast check** on dark UI, **screenshot backup** if projector fails (per spec fallback plan).

## Web Application Specific Requirements

### Project-Type Overview

FORESIGHT is a **browser-based, animation-heavy web application** built on **Next.js 14** with **Tailwind CSS** and **Framer Motion**, plus **react-map-gl** for Map mode. UX is organized as **four full-screen states** with **time-based choreography** (specified transition durations). The server exposes at least **`POST /api/simulate`** as the **orchestration surface** for the client.

### Technical Architecture Considerations

#### Browser matrix

| Tier | Browsers | Notes |
|------|----------|--------|
| **Demo / dev** | Latest **Chrome**, **Edge**, **Firefox**, **Safari** | Primary hackathon target. |
| **Map mode** | WebGL-capable builds | **react-map-gl** / Mapbox GL JS requirement for Demo 1. |
| **Graceful degradation** | Any browser that runs the app shell | **FallbackViz** if a mode fails; Map may show message or fallback if WebGL unavailable (implementation choice). |

#### Responsive design

- **Input:** Full-screen **dark command-center** layout; **large decision field** + **≤5 context fields** usable on **laptop-first**; tablet acceptable if **three-panel** layout **stacks or prioritizes** center HUD (implementation detail—spec implies desktop demo).
- **Simulation / dashboard:** **Path A | HUD | Path B**; side panels carry **~70% viz** each; center **Agent HUD** then **KPI stack**—layouts must **protect legibility** at **720p+ projector** resolution (per demo risk).
- **Deep dive:** Center expands; sides **compress to strips**—layout animation specified in master spec.

#### Performance targets

- **Perceived latency:** Simulation phase **~8–12s** total aligned to **API budget**; avoid **blocking the main thread** during **Framer Motion** + map renders.
- **Animation:** Maintain **smooth** HUD state transitions and **stagger** (0.15s KPI) without layout thrash; **count-up** ~1s per spec.
- **Payload:** Structured JSON from **`/api/simulate`** should stay **bounded** (no oversized narratives in hot path if it harms parse/render).
- **Cost:** Track **~11 LLM calls** per decision and **€0.10–0.30** order-of-magnitude from spec in test runs.

#### SEO strategy

- **MVP:** **Basic** title/description/social defaults via **`layout.tsx`**; **no** reliance on organic landing SEO for hackathon judgment.
- **Growth:** If a **marketing landing** splits from the app, add **static** SEO routes later (out of scope for one-day build).

#### Accessibility level

- **MVP bar:** **Keyboard-operable** primary flow where feasible; **focus visible** on **GlowButton** and form controls; **color contrast** checked for **text / dim text** tokens on **dark** surfaces; **motion**: prefer **reduced-motion** respect if trivial to add in Tailwind/Framer (recommended, not in original spec).
- **Rich visuals:** Map/flow/network are **inherently visual**—provide **textual KPI + narrative** as the **accessible outcome path** (already core to product).

### Implementation Considerations

- **Hosting / deploy:** **Vercel** free tier; respect repo **branch** strategy (**`main`** vs **`live`**) per `docs/DEPLOYMENT.md` for production promotion.
- **API contract:** Client depends on **stable** `viz_type`, **path labels**, per-path **agent + synthesis** objects, and **KPI derivation**—keep **TypeScript types** in **`lib/types.ts`** synchronized with prompts.
- **Streaming:** Choose **SSE** or **polling** early; wire **agent completion** to HUD transitions **deterministically** to reduce race bugs.
- **Third parties:** **Mapbox** (maps), optional **Google Places** later; **LLM** keys **server-side only**—never expose in client bundles.
- **Out of scope (CSV skip):** **Native apps**, **CLI**—not required for this PRD slice.

## Functional Requirements

### Intake & run initiation

- **FR1:** User can enter a single **either/or business decision** in natural language.
- **FR2:** User can provide **structured business context** using the product’s supported context fields.
- **FR3:** User can **start** a **paired-path simulation** (two alternatives evaluated together).

### Decision interpretation & routing

- **FR4:** System can derive **distinct Path A and Path B descriptions** consistent with the user’s decision.
- **FR5:** System can **classify** the decision into a **visualization category** (geo / market reach, resource allocation, or relationship network)—exposed to the client as a stable mode identifier (e.g. `viz_type`)—that controls how consequences are depicted.
- **FR6:** System can assign the **agent role palette** that matches the visualization category.

### Multi-agent simulation & synthesis

- **FR7:** For each path, system can run **multiple agent roles** such that **role outputs are not visible to other roles during prediction** for that path.
- **FR8:** For each path, system can produce **structured outputs per agent role** suitable for visualization and synthesis.
- **FR9:** For each path, system can **synthesize** agent role outputs into an **integrated assessment** for that path.

### In-run observability

- **FR10:** User can **observe progress** while both paths finish predicting.
- **FR11:** User can see **which agent roles** are waiting, in progress, or complete during a run.
- **FR12:** User can see **which visualization category** applies to the current run.

### Dual-path visualization

- **FR13:** User can view **side-by-side** consequence visualizations for Path A and Path B.
- **FR14:** When the decision is **location / reach / local-market weighted**, user can view **geography-oriented** consequence depictions for each path.
- **FR15:** When the decision is **budget / resource / investment weighted**, user can view **flow-oriented** consequence depictions for each path.
- **FR16:** When the decision is **partnership / stakeholder weighted**, user can view **relationship-oriented** consequence depictions for each path.
- **FR17:** User can still complete the **core comparison flow** if the preferred visualization mode is unavailable, using a **simplified consequence visualization**.

### Comparative outcomes

- **FR18:** After completion, user can view a **dashboard comparing** Path A and Path B across **multiple outcome dimensions**.
- **FR19:** User can compare **revenue-oriented** outcome signals across paths.
- **FR20:** User can compare **risk-oriented** outcome signals across paths.
- **FR21:** User can compare **customer-oriented** outcome signals across paths.
- **FR22:** User can compare **operating cost-oriented** outcome signals across paths.
- **FR23:** User can compare **competitive exposure-oriented** outcome signals across paths.
- **FR24:** User can view **opportunity-cost** phrasing (“what you’d miss”) where synthesis provides it.
- **FR25:** User can view an **overall per-path score** summarizing relative attractiveness.

### Deep narrative

- **FR26:** User can open a **deeper narrative view** that goes beyond the comparison dashboard.
- **FR27:** User can read **path-specific narrative** content with **attribution** to contributing agent perspectives.

### Transparency & limitations

- **FR28:** User can see **confidence / grounding signals** that distinguish **user-supplied context** from **generalized assumptions**.
- **FR29:** User encounters clear positioning that outputs are **simulated consequences**, not **guaranteed forecasts** or **personalized professional advice**.

### Resilience & continuity

- **FR30:** User can **complete the comparison experience** using a **stored full result** when **live execution** is unavailable.

### Programmatic execution

- **FR31:** Integrator can **request the same paired-path simulation** using the **same input envelope** available through the primary user experience.

## Non-Functional Requirements

*Scalability NFRs are omitted for the hackathon slice (no multi-tenant growth SLO).*

### Performance

- **NFR-P1 (time-to-insight):** For a representative demo decision, the **hero simulation phase** (from run start until both paths show **completed agent stages** and are ready for synthesis-driven results) completes within **12 seconds** at **p75** under nominal provider latency, matching the product’s intended pacing.
- **NFR-P2 (orchestration throughput):** A full paired-path run completes **end-to-end server work** within **8 seconds** at **p75** under nominal conditions for the chosen model tier (order-of-magnitude alignment with the master spec’s **5–8s** target).
- **NFR-P3 (client responsiveness):** During the primary run, the UI remains **interactive** (user can read HUD/state; no prolonged **main-thread freeze** that blocks navigation or cancellation affordances if provided).
- **NFR-P4 (results choreography):** After synthesis completes, the product reaches a **stable comparison dashboard** within **3 seconds** at **p75** (transition budget consistent with the specified dashboard entrance choreography).

### Security

- **NFR-S1 (secrets):** **LLM credentials** and **map provider tokens** exist **only** in **server-side** configuration; they are **never** embedded in client bundles or exposed to the browser.
- **NFR-S2 (transport):** Production traffic uses **HTTPS** for all client–server communication.
- **NFR-S3 (data minimization — MVP):** The system **does not require** storing **structured simulation outputs** in a persistent user account database for the hackathon MVP; any **cache** is explicitly for **continuity / demo** and is **bounded** (size TTL/overwrite policy is implementation-defined but must not grow without bound on a shared machine).

### Accessibility

- **NFR-A1 (keyboard):** Primary intake and run initiation are **operable with keyboard** (focusable controls, no keyboard traps in the main flow).
- **NFR-A2 (contrast):** Default dark-theme text and interactive states meet **WCAG 2.1 AA contrast** for **normal text** on **primary surfaces** used in the demo path (audit focused on **headline/body/KPI** readability).
- **NFR-A3 (motion):** The product respects **prefers-reduced-motion** for **non-essential** decorative animations where feasible without breaking comprehension of results.

### Integration

- **NFR-I1 (provider degradation):** If the **LLM provider** fails mid-run, the product can still satisfy **FR30** via **stored/cached full results** for demo continuity.
- **NFR-I2 (mapping degradation):** If **map-related services** fail or **WebGL** is unavailable, the product degrades to **non-map visualization** or **simplified visualization** without blocking the **comparison dashboard** path.
- **NFR-I3 (quota awareness):** Optional third-party **places** or **map** usage stays within **declared free-tier budgets** when those integrations are enabled (no silent runaway polling).
