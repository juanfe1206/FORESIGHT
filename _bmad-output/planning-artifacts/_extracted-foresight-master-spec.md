FORESIGHT

See what happens before you decide.

──────────────────────────────────

MASTER BUILD SPECIFICATION

The single source of truth for your hackathon build.

Team: 4 Data Analytics Students

Budget: €200 Cursor Credits | Timeline: 1 Day

Stack: Next.js 14 + Tailwind CSS + Framer Motion + react-map-gl

LLM: Claude API (Sonnet) or GPT-4o-mini

Date: March 2026

THIS DOCUMENT REPLACES all previous drafts.

It consolidates the Hackathon Blueprint, Visualization Spec,

and Product Brief into one build-ready reference.

Each section is labeled with the developer(s) who own it.

Jump to your section and start building.

Table of Contents

1. The Idea — What Foresight Is (Everyone reads this)

2. User Flow — The 4 Screen States (Everyone reads this)

3. Technical Architecture — Stack, API Calls, Cost (Dev 1 + Dev 2)

4. Agent Prompts — Copy-Paste Ready (Dev 2)

5. Decision Classifier — Viz Mode + Agent Role Selection (Dev 2)

6. Map View — Geographic Simulation (Dev 3)

7. Flow View — Resource Allocation Simulation (Dev 1)

8. Network View — Relationship Simulation (Dev 4)

9. Shared Components — Agent HUD, KPI Cards, Dashboard (Dev 4)

10. UI States & Transitions — Animation Specs (Dev 3 + Dev 4)

11. Design System — Colors, Fonts, Animation Tokens (Everyone)

12. Component Tree — Full File Structure (Everyone)

13. One-Day Build Plan — Hour-by-Hour Task Assignments (Everyone)

14. Demo Strategy — Script, Scenarios, Fallbacks (Everyone)

1. The Idea

EVERYONE READS THIS SECTION

1.1 One-Line Pitch

"See what happens before you decide — watch AI agents simulate

two futures for your business, side by side."

1.2 What It Is

Foresight is a visual A/B decision simulator for small business owners. The user inputs a real either/or business decision, provides basic context, and watches independent AI agents simulate the consequences of each path in real-time through an animated split-screen. The result is a comparative dashboard showing which path leads where and why.

1.3 Why It’s Different From ChatGPT

Multi-agent architecture: 4 independent AI agents (Customer, Competitor, Market, Cash Flow) each predict stakeholder behavior separately. They don’t see each other’s outputs.

Emergent outcomes: Results are not labeled optimistic/pessimistic top-down. They emerge from how agents independently react. The system doesn’t tell itself to be positive or negative.

Visual-first: Real-time animated agents thinking and connecting. Not a wall of text. The simulation IS the product.

Adaptive visualization: The system auto-detects the decision type and picks the right visual metaphor (Map, Flow, or Network). Not all decisions live on a map.

A/B framing: Every decision runs as two parallel simulations side by side. Instant comparison.

1.4 The Target User

Small business owners who make 50+ decisions daily with incomplete information, no advisors, no data team, and no board. They need a sounding board that shows consequences, not advice.

1.5 The Hackathon Prompt Fit

Prompt: "How to make someone’s day easier"

Answer: Remove the single biggest daily pain point for small

business owners — decision anxiety. Foresight replaces gut-feeling

with simulated consequence. That makes every day easier.

2. User Flow — The 4 Screen States

EVERYONE READS THIS SECTION

State 1: Input Screen

Full-screen dark form. The user types their decision (“Should I spend €500 on Instagram ads or partner with Café Central?”) and fills a short context form (industry, revenue, location, customer base, details). CTA: “Simulate My Decision.”

Key Design Details

Background: #0F1923 with subtle grid texture. Feels like a command center.

Decision input: Large text area. Auto-detects “A or B” vs “should I or shouldn’t I” framing.

Context fields: 5 fields max: Industry, Monthly Revenue, Location, Customer Base, Additional Details.

CTA: #00D4AA button with glow on hover. Text: “Simulate My Decision” not “Submit.”

State 2: Simulation Running (The Hero Moment)

Three-panel layout appears: Path A (left), Agent HUD (center), Path B (right). Panel headers show the user’s actual decision text (“Instagram Ads” vs “Café Partnership”). The adaptive visualization canvas (Map/Flow/Network) runs in each side panel. Center shows agents activating one by one.

Key Design Details

Panel headers: User’s exact words, NOT “Scenario A” / “Scenario B.”

Mode badge: Small pill at top: “🗺️ Map View — Location-based decision detected” shows the adaptive system.

Agent HUD (center): 4 agent circles transition: gray (dormant) → pulsing (thinking) → insight text → checkmark (complete).

Viz canvas: Occupies ~70% of each side panel. Different per mode (see sections 6–8).

Duration: 8–12 seconds total, matching natural API latency.

State 3: Results Dashboard

Same three-panel layout. Center transitions from Agent HUD to KPI comparison cards. Stacked cards slide in with winner badges (“→ Path A Wins”). Values animate with count-up effect. Overall score appears at bottom of each side panel with circular progress ring.

KPI Cards (6 total)

KPI

Source Agent

Format

Animation

Revenue Impact

Cash Flow

€ +/– per month

Count-up

Risk Score

All (synthesized)

1–10 color bar

Bar fills

Customer Impact

Customer

+/– count

Count-up

Operating Costs

Cash Flow

€ total

Count-up

Competitive Exposure

Competitor

Low/Med/High

Badge slides in

What You’d Miss

Synthesis

One sentence

Typewriter

State 4: Deep Dive

User clicks “Read Full Story.” Center panel expands, side panels compress to narrow strips showing miniaturized viz + score. Center shows tabbed narrative (Path A / Path B) with month-by-month story. Each paragraph has colored dots indicating which agent produced the insight.

3. Technical Architecture

DEV 1 + DEV 2 OWN THIS SECTION

3.1 Stack

Layer

Technology

Frontend

Next.js 14 + Tailwind CSS + Framer Motion

Maps

react-map-gl (Mapbox GL JS wrapper)

API Layer

Next.js API Routes (serverless)

LLM

Claude Sonnet API or GPT-4o-mini

Hosting

Vercel (free tier)

Dev

Cursor IDE

3.2 API Call Architecture

Per Decision (both paths):

1 parsing + classification call         =  1 call

4 agent calls × 2 paths (parallel)      =  8 calls

1 synthesis call × 2 paths (sequential)  =  2 calls

───────────────────────────────────────

Total: 11 API calls per decision

Estimated cost: €0.10–0.30 per decision

Estimated latency: 5–8 seconds

3.3 API Orchestration Flow

User submits decision + context → POST /api/simulate

Route calls LLM to parse decision into Path A / Path B + classify viz_type

Route fires 8 parallel agent calls (4 agents × 2 paths) using Promise.all

As each agent resolves, stream the result to frontend via Server-Sent Events or polling

When all 4 agents complete for a path, fire synthesis call for that path

Return complete results: { pathA: { agents, synthesis }, pathB: { agents, synthesis }, viz_type }

3.4 Data Grounding (Hybrid Model)

User-provided context: Industry, revenue, customer base, location from the form. Injected into every agent prompt.

LLM world knowledge: Agents fill gaps with trained knowledge about typical market patterns for the user’s industry.

Transparency: The confidence score reflects how much is user data vs. general assumptions. Shown in the dashboard.

4. Agent Prompts — Copy-Paste Ready

DEV 2 OWNS THIS SECTION

The system always runs 4 agents + 1 synthesis. But the agents adapt their role based on decision type. The classifier (section 5) returns both viz_type and an agent_roles array. Each agent slot gets a different system prompt depending on the decision context.

ADAPTIVE AGENT ROLES (lookup by viz_type):

MAP decisions:     Customer | Competitor | Market | Cash Flow

FLOW decisions:    Resource Impact | Opportunity Cost | Market Timing | Cash Flow

NETWORK decisions: Stakeholder | Partnership | Ecosystem | Risk/Reward

Implementation: one lookup object in lib/agents.ts

const AGENT_ROLES = { MAP: [...], FLOW: [...], NETWORK: [...] }

Then: AGENT_ROLES[viz_type] gives you the 4 role labels.

Each role maps to a prompt template below.

Below are the prompt templates for the default MAP roles. For FLOW and NETWORK roles, swap the system prompt’s opening line and “predict” focus to match the role name. The JSON response structure stays identical across all roles — only the framing changes.

4.1 Slot 1: Customer / Resource Impact / Stakeholder

SYSTEM: You are the Customer Agent in a business decision simulator.

You predict how customers will behave in response to a proposed business action.

Business Context:

- Industry: [from form]

- Location: [from form]

- Monthly Revenue: [from form]

- Customer Base Size: [from form]

- Additional Context: [from form]

Decision Path Being Evaluated: [Path A or B description]

Using your knowledge of typical customer behavior in [industry] in [location], predict impacts.

Respond ONLY with valid JSON:

{ "insight": "2-5 word headline",

  "customer_acquisition": number (+/-),

  "retention_impact": "positive" | "neutral" | "negative",

  "demographic_segments": [{ "name": string, "reaction": string, "size": string }],

  "confidence": number (0-100),

  "reasoning": "2-3 sentence explanation" }

4.2 Slot 2: Competitor / Opportunity Cost / Partnership

SYSTEM: You are the Competitor Agent. You predict how competitors will react

to this business decision in the local market.

Business Context: [same fields as above]

Decision Path: [Path A or B]

Known Competitors: [from Google Places or LLM-generated]

Respond ONLY with valid JSON:

{ "insight": "2-5 word headline",

  "competitor_reactions": [{ "name": string, "reaction": string,

    "action": string, "threat_level": 1-10 }],

  "market_share_impact": "gain" | "stable" | "loss",

  "competitive_advantage": string,

  "confidence": number (0-100),

  "reasoning": "2-3 sentences" }

4.3 Slot 3: Market / Market Timing / Ecosystem

SYSTEM: You are the Market Agent. You predict channel dynamics, platform

behavior, and market conditions relevant to this decision.

Business Context: [same fields]  |  Decision Path: [Path A or B]

Respond ONLY with valid JSON:

{ "insight": "2-5 word headline",

  "channel_effectiveness": number (1-10),

  "market_timing": "favorable" | "neutral" | "unfavorable",

  "opportunity_zones": [string],

  "saturation_risk": number (1-10),

  "confidence": number (0-100),

  "reasoning": "2-3 sentences" }

4.4 Slot 4: Cash Flow / Cash Flow / Risk-Reward

SYSTEM: You are the Cash Flow Agent. You predict financial impact over 3 months.

Business Context: [same fields]  |  Decision Path: [Path A or B]

Respond ONLY with valid JSON:

{ "insight": "2-5 word headline",

  "revenue_impact_monthly": number (EUR +/-),

  "upfront_cost": number (EUR),

  "ongoing_cost_monthly": number (EUR),

  "break_even_months": number | null,

  "roi_3_month": number (%),

  "risk_score": number (1-10),

  "confidence": number (0-100),

  "reasoning": "2-3 sentences" }

4.5 Synthesis Agent

SYSTEM: You are the Synthesis Agent. You receive outputs from 4 independent

agents and produce an integrated assessment for ONE decision path.

Agent Outputs: [paste all 4 agent JSON responses for this path]

Decision Path: [Path A or B]

Respond ONLY with valid JSON:

{ "overall_score": number (1-100),

  "revenue_impact": string (EUR with direction),

  "risk_score": number (1-10),

  "customer_impact": string (+/- number),

  "competitive_exposure": "Low" | "Medium" | "High",

  "operating_costs": string (EUR),

  "confidence": number (0-100),

  "what_youd_miss": "One sentence opportunity cost",

  "narrative": "3-5 paragraph month-by-month story",

  "headline": "One sentence summary" }

5. Decision Classifier

DEV 2 OWNS THIS SECTION

The parsing prompt includes a classification field that auto-selects the visualization mode.

Mode

Triggers On

Example

🗺️ MAP

Location, customers, market reach, foot traffic, local competition

"Instagram ads vs. café partnership"

🌊 FLOW

Budget, time, resources, investment, hiring, infrastructure

"Upgrade oven vs. hire social media manager"

🔗 NETWORK

Partnerships, supply chain, stakeholders, team dynamics

"Join business association vs. operate independently"

Add to Parsing Prompt

"Also classify the visualization type and agent roles:

- MAP: if decision involves location, customers, local market, foot traffic

  agents: [Customer, Competitor, Market, Cash Flow]

- FLOW: if decision involves allocating resources, budget, time, investment

  agents: [Resource Impact, Opportunity Cost, Market Timing, Cash Flow]

- NETWORK: if decision involves relationships, partnerships, stakeholders

  agents: [Stakeholder, Partnership, Ecosystem, Risk/Reward]

Return: { pathA: string, pathB: string,

  viz_type: 'MAP' | 'FLOW' | 'NETWORK',

  agent_roles: [string, string, string, string] }"

NOTE: You can hardcode the role lookup in the frontend instead

of asking the LLM for it. Either way works. Hardcoded is safer:

const AGENT_ROLES = {

  MAP: ['Customer', 'Competitor', 'Market', 'Cash Flow'],

  FLOW: ['Resource Impact', 'Opportunity Cost', 'Market Timing', 'Cash Flow'],

  NETWORK: ['Stakeholder', 'Partnership', 'Ecosystem', 'Risk/Reward']

}

6. Map View — Geographic Simulation

DEV 3 OWNS THIS SECTION

Triggers when decision involves customers, location, marketing reach, or local competition. Uses react-map-gl (Mapbox) with Framer Motion overlays.

6.1 Visual Elements (Per Side)

Business Pin: Pulsing marker at user’s location. Glow intensifies with positive outcomes.

Customer Dots: Colored dots representing demographics. Appear at edges, flow toward/away from business. Colors: blue = young professionals, orange = families, green = tourists.

Competitor Pins: Red pins at competitor locations (Google Places API or LLM-generated). Pulse when Competitor Agent predicts aggression. Fade if no reaction.

Heat Overlay: Gradient layer showing opportunity (warm) vs. saturation (cool) from Market Agent.

Cash Flow Ticker: Floating counter at bottom of each half. Revenue/cost ticking up/down from Cash Flow Agent.

6.2 Animation Timeline

Time

Event

Visual

0–1s

Map loads

Zoom to user’s city. Business pin drops with bounce. Split divider slides in.

1–3s

Customer Agent

HUD glows blue. Customer dots flow inward. Speed/quantity reflect prediction.

3–5s

Competitor Agent

HUD glows red. Competitor pins appear. Some pulse, some dim.

5–7s

Market Agent

HUD glows green. Heat overlay fades in.

7–9s

Cash Flow Agent

HUD glows gold. Revenue ticker starts. Cost arrows appear.

9–12s

Synthesis

All connect. Map settles. Score cards slide up.

6.3 Competitor Data

Option A (impressive): Google Places API — query user’s industry + location for real competitors. Free tier = 100 requests/day.

Option B (fastest): LLM-generated — ask agent to generate plausible competitor names + locations.

Option C (safest): Hardcoded demo data — pre-set competitor pins for the demo bakery scenario.

Build Option B as default. Have Option C as demo fallback. Add Option A if time permits.

6.4 Components

MapView.tsx       ← Split-screen container

MapHalf.tsx       ← One side (reused for A and B)

CustomerDots.tsx  ← Animated dots with Framer Motion

CompetitorPins.tsx ← Pulsing competitor markers

HeatOverlay.tsx   ← Gradient canvas overlay

CashFlowTicker.tsx ← Animated counter

7. Flow View — Resource Allocation Simulation

DEV 1 OWNS THIS SECTION

Triggers when decision involves budget, time, investment, hiring, or infrastructure. Built with SVG paths + Framer Motion particles. No extra library needed.

7.1 Visual Elements (Per Side)

Resource Pool (top): Container with the resource amount (€500). Fill level drops as particles flow out.

Channel Pipes: SVG paths representing allocation channels. Width varies by flow volume. Labeled (e.g., “Ad Spend”, “Creative Production”).

Particles: Small dots flowing along SVG paths. Speed/density reflect agent predictions. Color shifts green → red along path (positive ROI → diminishing returns).

Outcome Pools (bottom): Collection basins labeled with outcomes (“New Customers”, “Revenue”, “Wasted Spend”). Fill level = relative impact.

Leak Points: Animated drips at junctions = risk/waste from Cash Flow Agent. Competitor pressure shown as squeezed pipes.

7.2 Particle Animation Technique

1. Define SVG <path> elements for each channel

2. Create small <circle> elements as particles

3. Use CSS offset-path to bind circles to paths

4. Animate offset-distance 0% → 100% with Framer Motion

5. Stagger spawning every 200ms with setInterval

6. Vary speed based on agent data (faster = more flow)

7. Color-shift with interpolateColors along the path

Result: "flowing river" effect. Pure CSS + Framer Motion.

No physics engine. Very performant.

7.3 Components

FlowView.tsx      ← Split container

FlowHalf.tsx      ← One side (reused)

ResourcePool.tsx  ← Animated fill container

FlowPipe.tsx      ← SVG path with width animation

Particles.tsx     ← Dot spawner along paths

OutcomePool.tsx   ← Collection basin with fill

LeakPoint.tsx     ← Drip/waste indicator

8. Network View — Relationship Simulation

DEV 4 OWNS THIS SECTION

Triggers when decision involves partnerships, supply chain, stakeholders, or team dynamics. Simple circular layout with Framer Motion. No D3 or physics engine needed.

8.1 Visual Elements (Per Side)

Business Node (center): User’s business as prominent center node with name. Glowing accent color.

Stakeholder Nodes: Circles around center representing actors: Customers, Partner, Supplier, etc. Sized by importance. Icons + labels. LLM generates these from context.

Relationship Lines: SVG lines between nodes. Thickness = strength. Color: green (positive) → yellow (neutral) → red (tension). Animate as agents predict changes.

Ripple Effects: When an agent predicts change, expanding circle animation from the affected node outward through connections. Shows second-order effects.

Sentiment Halos: Soft glow around each node. Color shifts with overall sentiment toward your business.

8.2 Layout Strategy (No Physics Engine)

1. Business node at center (50%, 50%)

2. Stakeholder nodes in circle around center

3. Use Math.cos(angle) / Math.sin(angle) for positioning

4. Framer Motion animates position, scale, opacity

5. Lines are SVG <line> between node centers

6. Animate stroke-width and stroke color

"Movement" = adjust radius per node based on agent data.

Closer = stronger relationship. Further = weaker.

This is ~50 lines of layout logic, not a physics engine.

8.3 Components

NetworkView.tsx       ← Split container

NetworkHalf.tsx       ← One side (reused)

BusinessNode.tsx      ← Center node with glow

StakeholderNode.tsx   ← Circle with icon + label

RelationshipLine.tsx  ← SVG line with animated width/color

RippleEffect.tsx      ← Expanding circle on events

9. Shared Components

DEV 4 OWNS THIS SECTION

9.1 Agent HUD

Appears in center panel during State 2 (simulation). Consistent layout across all three viz modes: always 4 agent nodes. But the LABELS adapt based on viz_type — showing the role names from the AGENT_ROLES lookup.

AGENT NODE STATES:

○ Gray circle     = dormant (waiting)

● Pulsing color   = thinking (API call in flight)

● + insight text  = resolved (showing 2-5 word headline)

✔ + solid fill    = complete (checkmark)

AGENT COLORS (fixed by slot position, not by role name):

Slot 1 = #2196F3 (blue)   ← Customer / Resource Impact / Stakeholder

Slot 2 = #FF4757 (red)    ← Competitor / Opportunity Cost / Partnership

Slot 3 = #00D4AA (green)  ← Market / Market Timing / Ecosystem

Slot 4 = #FFD700 (gold)   ← Cash Flow / Cash Flow / Risk-Reward

The label text next to each circle comes from AGENT_ROLES[viz_type].

Colors stay fixed so the visual language is consistent.

9.2 KPI Cards

Appear in center panel during State 3 (dashboard). Stacked vertically. Each card shows metric name, values for both paths, proportional comparison bars, and a winner badge.

KPI CARD STRUCTURE:

┌──────────────────────────────────────┐

│ Revenue Impact          → Path A Wins │

│ A: +€320/mo   |   B: +€180/mo        │

│ [███████████]   [██████░░░░░]     │

└──────────────────────────────────────┘

Winner = accent green bar | Loser = muted gray bar

Winner badge = colored pill with arrow, top-right corner

Values animate with count-up from 0 (1s duration)

Cards stagger in from below (0.15s delay between each)

9.3 Score Ring

Circular progress indicator at bottom of each side panel showing overall score (1-100). Number counts up inside the ring. Ring fills clockwise with accent color.

9.4 Fallback Visualization

If any viz mode isn’t ready, the VizRouter falls back to a simple 4-node animation: four circles in a diamond pattern with connection lines drawing between them as agents activate. Works for any decision type. This is your safety net.

10. UI State Transitions

DEV 3 + DEV 4 OWN THIS SECTION

10.1 Input → Simulation (1.2s)

CTA button pulses with glow, then shrinks

Form card scales to 0.95, moves up, fades to 60%

Three-panel layout expands from center (Framer Motion layout)

Panel headers appear with user’s decision text

Mode pill badge fades in at top

Agent HUD appears in center, all agents dormant

Viz canvas initializes in both side panels

10.2 Simulation → Dashboard (2.5s)

Synthesis agent completes. Brief 0.5s pause.

Agent HUD fades out (0.3s)

“Direct Outcome Comparison” header slides down

KPI cards slide in one by one (stagger: 0.15s)

Values animate with count-up (1s per value)

Winner badges slide in after values settle (0.3s delay)

Score rings appear at bottom of side panels

“Deep Dive” button fades in at bottom center

10.3 Dashboard → Deep Dive (0.6s)

Side panels compress to narrow strips (Framer Motion layout)

KPI cards dissolve, narrative text fades in

Path tabs appear at top of expanded center panel

11. Design System

EVERYONE — APPLY CONSISTENTLY

11.1 Colors

Token

Hex

Usage

--bg

#0F1923

Page background

--surface

#1B2838

Cards, panels, elevated elements

--border

#2A3A4A

Subtle borders on dark surfaces

--accent

#00D4AA

Primary CTA, winners, positive states, Market Agent

--blue

#2196F3

Customer Agent, map mode accent

--red

#FF4757

Competitor Agent, risk, negative

--gold

#FFD700

Cash Flow Agent, financial data

--warm

#FF6B35

Warning, medium risk

--purple

#7B68EE

Network mode accent

--text

#F0F4F8

Primary text on dark backgrounds

--text-dim

#8892A0

Secondary text, labels

11.2 Typography

Role

Font

Specs

Headlines

Space Grotesk

Bold, tracking-tight, 24–36px

Body / Labels

DM Sans

Regular/Medium, 14–16px

Data / Numbers

JetBrains Mono

Monospace, for counters and scores

Google Fonts link for layout.tsx:

https://fonts.googleapis.com/css2?

family=Space+Grotesk:wght@500;700

&family=DM+Sans:ital,wght@0,400;0,500;1,400

&family=JetBrains+Mono:wght@400;500&display=swap

11.3 Animation Standards

Element

Spec

Agent activation

scale 0→1, opacity fade, spring (stiffness: 200, damping: 20)

Pulse/glow

boxShadow with agent color, 1.5s infinite

Line drawing

strokeDashoffset full→0, 0.8s ease-out

Score card entrance

y: 40→0 + opacity, staggered 0.15s

Particles (Flow)

offset-distance 0%→100%, 2–4s linear, staggered

Node movement (Network)

x/y spring physics, 0.6s

Color transitions

0.4s ease-in-out on color/fill

Count-up numbers

1s duration, easeOut, JetBrains Mono font

12. Component Tree

EVERYONE — THIS IS YOUR FILE STRUCTURE

app/

  page.tsx                       ← State machine (input/sim/dashboard/dive)

  layout.tsx                     ← Dark theme, fonts, meta tags

  globals.css                    ← CSS variables, Tailwind config

app/api/

  simulate/route.ts             ← Orchestrator: parse → classify → agents → synth

lib/

  agents.ts                      ← API call functions for all 5 agents

  classifier.ts                  ← viz_type parser

  types.ts                       ← TypeScript interfaces for all responses

components/

  input/

    DecisionForm.tsx             ← [DEV 1] Full input screen

    ContextFields.tsx            ← [DEV 1] Dropdowns + text fields

  simulation/

    SimulationContainer.tsx      ← [DEV 1] Three-panel layout + state router

    PanelHeader.tsx              ← [DEV 1] Decision text + mode badge

    VizRouter.tsx                ← [DEV 1] Selects Map/Flow/Network/Fallback

  viz/

    MapView/

      MapView.tsx                ← [DEV 3] Split-screen map container

      MapHalf.tsx                ← [DEV 3] Single map side

      CustomerDots.tsx           ← [DEV 3] Animated demographic dots

      CompetitorPins.tsx         ← [DEV 3] Pulsing competitor markers

      HeatOverlay.tsx            ← [DEV 3] Gradient opportunity overlay

      CashFlowTicker.tsx         ← [DEV 3] Animated revenue counter

    FlowView/

      FlowView.tsx               ← [DEV 1] Split flow container

      FlowHalf.tsx               ← [DEV 1] Single flow side

      ResourcePool.tsx           ← [DEV 1] Draining resource container

      FlowPipe.tsx               ← [DEV 1] SVG path with variable width

      Particles.tsx              ← [DEV 1] Dots flowing along paths

      OutcomePool.tsx            ← [DEV 1] Filling result basins

      LeakPoint.tsx              ← [DEV 1] Waste/risk indicators

    NetworkView/

      NetworkView.tsx            ← [DEV 4] Split network container

      NetworkHalf.tsx            ← [DEV 4] Single network side

      BusinessNode.tsx           ← [DEV 4] Center node with glow

      StakeholderNode.tsx        ← [DEV 4] Positioned circle + icon

      RelationshipLine.tsx       ← [DEV 4] Animated SVG line

      RippleEffect.tsx           ← [DEV 4] Expanding circle animation

    FallbackViz.tsx              ← [DEV 4] Safety net 4-node animation

  agents/

    AgentHUD.tsx                 ← [DEV 4] 4-agent status panel

    AgentNode.tsx                ← [DEV 4] Single agent circle

    InsightBubble.tsx            ← [DEV 4] Tooltip with agent headline

  dashboard/

    KPIPanel.tsx                 ← [DEV 4] Stacked KPI cards container

    KPICard.tsx                  ← [DEV 4] Single comparison card

    WinnerBadge.tsx              ← [DEV 4] "→ Path A Wins" pill

    ScoreRing.tsx                ← [DEV 4] Circular progress + number

    ComparisonBar.tsx            ← [DEV 4] Proportional fill bars

  narrative/

    DeepDivePanel.tsx            ← [DEV 3] Expanded story view

    PathTabs.tsx                 ← [DEV 3] Path A / Path B toggle

    NarrativeText.tsx            ← [DEV 3] Formatted story text

  shared/

    ModeBadge.tsx                ← [DEV 3] Viz mode indicator pill

    CountUpNumber.tsx            ← [DEV 4] Animated number counter

    GlowButton.tsx              ← [DEV 1] Accent CTA with glow

13. One-Day Build Plan

EVERYONE — YOUR HOUR-BY-HOUR SCHEDULE

Morning: Hours 1–4 (Foundation)

Dev

Task

Deliverable

Dev 1

Next.js setup + DecisionForm + ContextFields + GlowButton

Working input screen (State 1) with dark theme

Dev 2

API route + all 5 agent prompts + classifier + types.ts

POST /api/simulate returning structured JSON for both paths

Dev 3

react-map-gl setup + MapView + CustomerDots + CompetitorPins

Working split-screen map with animated markers

Dev 4

AgentHUD + AgentNode + KPICard + WinnerBadge + ScoreRing

Working HUD with state transitions + dashboard cards

Afternoon: Hours 5–8 (Integration + Additional Modes)

Dev

Task

Deliverable

Dev 1

SimulationContainer + VizRouter + FlowView (all 7 components)

Three-panel layout routing to correct viz + working flow animation

Dev 2

Integration: form → API → state machine → viz → dashboard

Full end-to-end flow from input to animated results

Dev 3

Map polish (HeatOverlay + CashFlowTicker) + DeepDivePanel

Polished map with all elements + narrative deep dive view

Dev 4

NetworkView (all 6 components) + FallbackViz + KPIPanel

Working network graph + fallback safety net + dashboard integration

Final Sprint: Hours 9–10

All together: Integration testing across all three viz modes. Test the classifier routing.

Demo prep: Run all three demo scenarios (see section 14). Verify each triggers the correct viz mode.

Polish pass: Consistent colors, smooth transitions, loading states, error handling.

Cache a response: Save one complete API response. If API fails during demo, load cached data.

Rehearse pitch: Practice the 60-second demo script with live app.

PRIORITY ORDER IF RUNNING OUT OF TIME:

1. Map View (most visually impressive for demo)

2. Flow View (strong second mode)

3. Network View (replace with FallbackViz if needed)

Two polished modes + fallback > three broken modes.

14. Demo Strategy

EVERYONE — REHEARSE THIS TOGETHER

14.1 Three Demo Scenarios

Prepare these exact inputs. Each triggers a different viz mode, showing the adaptive system.

Demo 1: Map View

Decision: "Should I spend €500 on Instagram ads targeting young

professionals, or partner with Café Central for cross-promotion?"

Context: Bakery in Malasaña, Madrid. €3,000/mo revenue.

~200 regular customers. Mostly foot traffic.

WHY: Judges see a real Madrid map with competitors + customer dots.

Demo 2: Flow View

Decision: "Should I invest €2,000 in upgrading my oven, or spend

it on hiring a part-time social media manager?"

Context: Same bakery. Oven limits production to 80 pastries/day.

No social media presence.

WHY: Judges see budget flowing through infrastructure vs. marketing.

Demo 3: Network View

Decision: "Should I join a local business association and share

delivery with 3 food businesses, or keep operating independently?"

Context: Same bakery. Delivery costs €400/mo solo.

Association fee €100/mo for shared delivery.

WHY: Judges see partnership nodes forming and relationship lines.

14.2 60-Second Demo Script

[10s] PROBLEM: "Every day, small business owners face decisions

with no data, no advisors, and no safety net."

[5s] SOLUTION: "Foresight lets them see what happens before they

commit." [type decision into the form, hit Simulate]

[15s] SIMULATION: "Watch — four independent AI agents are

simulating each path right now. Customers, competitors, market

dynamics, cash flow — all predicting in parallel."

[point to animated agents activating on each side]

[10s] RESULTS: "Path A gets more reach but burns budget fast.

Path B is slower but builds a lasting channel."

[gesture at the KPI comparison cards]

[10s] ADAPTIVE: "And watch what happens with a different type

of decision—" [quickly show Flow or Network mode]

"The system detects the decision type and picks the right

visualization automatically."

[10s] CLOSE: "Foresight doesn’t tell you what to do.

It shows you what happens."

14.3 Why This Wins With Your Judges

For VC Judges

Massive TAM: Millions of small businesses worldwide making daily decisions with no support.

Novel architecture: Multi-agent simulation is fundamentally different from single-pass LLM wrappers.

Clear monetization: Freemium — 3 free decisions/month, then subscription.

For Technical Judges (Engineers, Cursor Dev)

Parallel agent execution: Real concurrent LLM calls, not sequential chat.

Emergent behavior: Outcomes arise from independent agent interaction.

Adaptive UI: Decision classifier auto-selects visualization. Three modes from one input.

For UI/UX Judge

Visual-first: The simulation IS the interface. Not a chatbot with charts.

Contextual visualization: Map for location decisions, flow for budget, network for relationships.

Polished transitions: Four distinct screen states with intentional animation between each.

14.4 Fallback Plan

API failure: Load cached response from localStorage. Play animation from saved data. Mention the live version connects to real LLM.

Viz mode not ready: FallbackViz.tsx shows the 4-node diamond animation. Works for any decision type.

Projector issues: Dark themes can look washed out. Test contrast beforehand. Have a screenshot backup.

Time overrun: If demo runs long, skip Demo 3 (Network). Two modes is enough to show adaptive system.

This is your single source of truth.

No other documents. Just this one.

Now go build Foresight. Good luck at the hackathon! 🚀