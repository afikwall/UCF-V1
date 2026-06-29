---
name: solution-plan
description: Deep planning for a blocks.diy ERP-anchored agent app — run a discovery interview, capture the customer's as-is workflows, exhaust clarifying questions, then produce a buildable plan (workflows to automate, data structure, UI/UX). Load this skill in Solution mode and whenever the request needs a full solution design rather than a direct build.
user-invocable: false
---

# Solution Plan

Turn a customer's real back-office work into a buildable plan for a blocks.diy ERP-anchored agent app.
The plan has three required outputs, in this order of dependency:

Workflows to automate — the to-be agent flows, derived from the workflows the customer does manually today
Data structure — the entities, fields, and relationships the agents read and write
UI/UX — the worlds, agents, cards, deep dives, and panels the customer interacts with

You produce these by first running a discovery interview. Do not skip discovery — a plan invented without the customer's actual workflows is the single most common way these builds go wrong. The whole point of blocks.diy is to automate their process, not a generic one.
Platform context (what you are planning for)
blocks.diy builds custom back-office agents for operations-heavy, inventory-on-ERP companies (manufacturers, distributors, industrials, multi-location operators). The agents sit on top of the customer's ERP (e.g. Priority, SAP Business One) and run real workflows end to end.
Scope lives inside four mega-processes. Anchor every plan to one or more of them:

O2C — Order to Cash (sales, order desk, customer service)
P2P — Procure to Pay (sourcing, RFQs, supplier negotiation)
R2R — Record to Report (planning, close, reporting)
Inventory Management — stock levels, reorders, dead stock, forecasting

If a prospect is finance-only, a single-function SaaS replacement, or has no inventory on the ERP, flag it — that is outside the validated ICP and the plan should say so rather than pretend it fits.
The unit of the product is an agent: a named operator with a role, a work mode, the tool calls it can make, and explicit hard limits / human-handoff points. A finished app is a small set of agents organized into "worlds." Plan in terms of agents, not features.
Workflow

1. Frame the engagement
   Open by confirming what you're planning and for whom. Accept a customer name, a vertical, or a raw use case. Establish:

Who is the customer and what do they make / move / sell?
What ERP do they run on, and is inventory managed there?
Which of the four mega-processes is in scope for this engagement?
Is this one agent or a multi-agent world?

Be conversational. Ask the most load-bearing questions first; fill gaps as you go. Don't dump the whole list at once. 2. Discovery interview — capture the AS-IS workflows
This is the heart of the skill and the part most worth getting right. For each process in scope, get the customer to walk you through what a person does today, step by step, before any automation. For every workflow capture:

Trigger — what kicks it off (an order email arrives, stock dips, a supplier replies, month-end)
Steps — the actual sequence the human performs, including the systems they touch and the data they look up
Decisions & judgment calls — where a human decides something, and on what basis (this becomes the agent's reasoning)
Exceptions & escalations — when they break the routine, who they hand off to, and the threshold that triggers it
Inputs/outputs — what data goes in, what record or message comes out
Volume & pain — how often this happens and where it hurts (time, errors, delays). This is how you prioritize what to automate first.
Channels — where the work happens (portal, email, EDI, WhatsApp, phone, showroom). Operations-heavy customers are almost always multi-channel.

Push for specifics: real SKUs, real customer names, real thresholds, real numbers. A plan grounded in "orders over ₪200K go to the sales manager" is buildable; "large orders get reviewed" is not.
If a project tracker, knowledge base, or design tool is connected, pull related tickets, prior research, or existing mockups to ground the interview. If nothing is connected, work entirely from what the customer tells you — do not ask them to connect tools. 3. Resolve open questions before you design — the gate
Do not design a single agent while load-bearing questions the customer could answer remain unasked. Discovery rarely ends with everything known, but the customer can almost always answer far more than you'd assume — and a real answer makes the plan more accurate than a guess or a placeholder ever will. This gate exists because the most common failure mode is jumping to design with half the facts and burying the rest as "open questions" the customer would happily have answered on the spot.

Compile the gaps you've surfaced during discovery — the load-bearing unknowns especially: real thresholds, capacities, ID/SKU schemes, who approves what, where each piece of data actually lives, volumes, lead times, channel specifics, integration access.
Ask in focused rounds, not one overwhelming dump. Lead each round with the questions whose answers most change the design — a threshold that sets a hard limit, a capacity that drives simulation math, the approval chain that sets human-in-the-loop. Use the AskUserQuestion tool where the answer is a choice; ask in prose where it's open-ended.
Iterate until exhausted. Every answer tends to unlock a sharper follow-up — keep going, round after round, until the customer signals they can't answer or it doesn't matter yet. Treat "I don't know" as a valid stop for that thread, not a reason to end the interview; move to the next gap.
Only genuinely unanswerable or deferred questions survive into the plan's "Open questions" section, each tagged with who will answer it. A placeholder in the plan is a last resort, never a substitute for a question you could have asked.

When the customer has answered everything they can — and only then — move to design. 4. Design the TO-BE workflows to automate
For each as-is workflow worth automating, design the agent version. Prioritize by volume × pain (high-frequency routine work is the best first automation; rare high-judgment work is often a handoff, not an automation).
For each automated workflow, specify:

Agent & role — which named agent owns it and what its work mode is (see work modes below)
Trigger — event, schedule, or inbound message
Steps as tool calls — the sequence the agent executes, named like real functions (search_products, create_order, open_po, send_rfq), with what each reads and writes
Reasoning surfaced — what the agent explains to the user so they trust the decision
Human-in-the-loop points — what the agent does autonomously vs. what it drafts and waits for approval on
Hard limits — thresholds and rules that force a handoff to a named human (never let an agent invent data or exceed a money/risk threshold silently)
Cross-agent moments — where this workflow triggers another agent (e.g. a sale that would drop inventory below threshold auto-triggers the sourcing agent)

Agent work modes (pick the one that fits each agent)

High-throughput / triage — many similar items, the user scans and triages (e.g. an order-desk agent). Dashboard is a grid of tiles; optimize for 1-second decisions.
Operational / batch — continuous monitoring, many small mostly-routine decisions, data → action (e.g. an inventory agent).
Transactional — single high-value decision moments with options to weigh (e.g. a sourcing agent running an RFQ).
Relational — sensitive customer-facing decisions where wording and timing matter (e.g. a customer-service agent). Agent drafts, human approves before anything goes out.

The work mode drives the UI — say which mode each agent is and let that flow into the UX section. 5. Design the DATA STRUCTURE
List the entities the agents read and write. For each entity: its key fields, its identifier convention, and its relationships to other entities. Ground it in the customer's ERP reality (their SKU scheme, their customer ID range, their order statuses, their channels). Cover:

Core records — orders, line items, products/SKUs, customers, suppliers, POs, RFQs, cases — whichever the in-scope processes touch
Status enumerations — the real lifecycle states a record moves through (e.g. order: auto-filed → stock check → in production → shipped), since agents act on status transitions
Reference/lookup data — channels, payment terms, thresholds, lead times
Audit data — every agent action and tool call needs to be recordable, because the audit trail is a first-class product surface (see UI/UX). Note what gets logged.

Call out where the data lives in the ERP vs. what blocks.diy stores, and any matching/resolution logic (e.g. matching an inbound order's free-text product name to an internal SKU). 6. Design the UI/UX
blocks.diy apps share a consistent shape. Plan the customer's app against these patterns rather than inventing new ones:

Worlds — top-level navigation, one per mega-process in scope (Sales & Customer / Procurement & Supply / Inventory & Warehouse / Finance & Control). Each world has a chat-style "world agent" entry point and page-level agents underneath.
The 3-tier pattern — every agent moment exists at three depths:

Card — a 1-second visual on the dashboard; the user decides without reading. Every card has one signature visual that carries the decision (a progress strip, an inventory chart, a price strip across suppliers, a delivery timeline). Specify that visual per agent.
Deep dive — a 3-minute review of full context with decision options.
Audit trail — a 15-minute drill into every tool call and decision the agent made.

Card states — visual urgency progression: routine (white/grey) → awaiting decision (amber) → urgent (red) → completed (green). Specify which states each agent's cards use.
Two-panel chat layout — agent chat pages are ~60% chat / ~40% right panel with a tab toggle: an activity tab (recent-window summary, stat tiles, activity ticker) and an insights tab (alerts, patterns, watchlists). Specify the stat tiles and insights per agent — these are also the screenshots that sell the demo.
Multi-channel communication — outbound agents talk to the outside world over WhatsApp / email / phone / Telegram with channel-tinted message bubbles. Specify channels per agent.
Localization — match the customer's market (e.g. Hebrew-first, RTL throughout for Israeli customers). State it explicitly; it affects every screen.

For each agent, produce: its world, its dashboard card (and signature visual), its card states, its deep-dive layout, and its two panels. 7. Assemble the plan and review
Produce the plan document with these sections:

Customer & scope — who they are, ERP, processes in scope, ICP fit (flag if outside ICP)
Agents — the named roster, each with role, work mode, and the workflows it owns
Workflows to automate — the to-be flows, prioritized, each in the format from step 4
Data structure — entities, fields, relationships, statuses, audit, ERP/store split
UI/UX — worlds, per-agent cards/deep-dives/panels, shared patterns, localization
Open questions — only what genuinely remains after the step-3 gate, tagged with who answers

Then review with the user: ask which sections need adjustment, offer to expand any agent into a build brief for Ella (the build agent), and offer to draft demo data conventions (ID ranges, SKU codes, sample records) if this is heading toward a demo.
Output format
Markdown with clear headers, scannable by someone reading only headers and bold text. Where a workflow or data model is naturally tabular (steps, fields, statuses, supplier comparisons), use a table. Lead each major section with a one-line conclusion so a busy reader gets the gist fast.
If this plan is destined for the vault, follow the vault's conventions: YAML frontmatter, [[wikilinks]] to related notes ([[O2C]], [[Heartwood Demo App]], the customer's note), and an ISO updated: date.
Principles

Discovery before design. The as-is workflow capture is the foundation. If you find yourself designing agents before you understand what the customer does manually, stop and go back to step 2.
Exhaust the answerable questions before you build. Surface your open questions to the customer and ask them in rounds — they can usually answer far more than you assume, and a real answer beats a placeholder every time. Keep asking follow-ups until they genuinely can't answer; only then does a gap belong in the plan's Open Questions. This is the step-3 gate, and it is not optional.
Plan in agents, not features. The deliverable is a roster of named operators with roles, tool calls, and limits — not a feature list.
Ground everything in their reality. Real SKUs, real thresholds, real ID schemes, real channels. Specifics are what make a plan buildable.
Always specify the hard limits. Every agent needs explicit thresholds and human-handoff rules. An agent with no limits is a liability, not a product.
Be ruthless about scope. Concentrate on the highest volume × pain routine work; resist scoping the whole back office into a single plan.
Respect the ICP. If the customer is finance-only or has no inventory on the ERP, say so plainly rather than forcing a fit.
