---
name: app-artifacts
description: The complete guide to defining a Blocks app's backend — data model, logic, automations, AI agents, and roles — as JSON "artifact" files under the artifacts/ directory. Load this skill for ANY request that creates, changes, or deletes data tables, actions/logic, views, workflows, roles, agents, or agent-chats, and for every new app. For theme/colors/branding, load the separate `theme` skill instead. Links to per-type schema docs in sub-folders.
user-invocable: false
---

# App Artifacts

A Blocks app's **backend** (data model, logic, AI, roles) is defined as JSON files under the **`artifacts/`** directory at the project root. The **frontend** (React/TypeScript) lives under `src/` and is governed by `CLAUDE.md` and the UI skills (`app-layout`, `shadcn`, `blocks-client`, etc.). **Theme** (colors, fonts, palette) lives in **`src/theme.css`** — see the **`theme`** skill, not this one.

When the project is built, the artifact files are synced to the Blocks platform: tables, views, actions (DAG + code), agents, agent-chats, and workflows are created/updated/deleted from these files; roles are create-only (no edit/delete). Theme syncs from `src/theme.css` separately. So **to add or change backend behavior, you edit artifact JSON files** — not platform UI.

## Artifacts directory layout

```
artifacts/
  tables/        <Name>.json    data tables (entities, columns, relationships)
  actions/       <Name>.json    backend logic (DAG actions + code actions)
  views/         <Name>.json    read-only derived data (aggregations/joins)
  workflows/     <Name>.json    trigger → action automations
  roles/         <Name>.json    user personas (only for 2+ personas)
  agents/        <Name>.json    reusable AI personas
  agent-chats/   <Name>.json    chat UI surfaces backed by an agent
  app.json                      app name & description
```

## Per-type schemas (read the matching doc before writing that artifact)

Each artifact type has its exact JSON schema and rules in a sub-folder. **Read the relevant doc before creating/updating/deleting that type** — do not guess shapes.

| When the request involves…                                    | Read                                        | Writes to                |
| ------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| Data model — tables, columns, relationships, demo data        | [tables](./tables/tables.md)                | `artifacts/tables/`      |
| Backend logic — CRUD, integrations, AI/agent calls, code      | [actions](./actions/actions.md)             | `artifacts/actions/`     |
| OAuth / API secrets before integration or code actions        | load **`integrations`** skill               | (skill only)             |
| Derived data — aggregations, joins, filtered/computed columns | [views](./views/views.md)                   | `artifacts/views/`       |
| Scheduled / event-driven automation                           | [workflows](./workflows/workflows.md)       | `artifacts/workflows/`   |
| 2+ distinct user personas with different experiences          | [roles](./roles/roles.md)                   | `artifacts/roles/`       |
| An AI agent persona (instructions, tools, memory)             | [agents](./agents/agents.md)                | `artifacts/agents/`      |
| A chat UI surface backed by an agent                          | [agent-chats](./agent-chats/agent-chats.md) | `artifacts/agent-chats/` |
| App name / description (rename, retitle, describe the app)    | [app](./app/app.md)                         | `artifacts/app.json`     |

For colors, palette, branding, dark/light mode, or fonts → load the **`theme`** skill and edit `src/theme.css`.

## Build workflow (order matters)

Data → Logic → UI. Requirements flow backward (UI needs → logic → data); changes flow forward. Update every affected layer in the same pass — never change one layer in isolation if others depend on it.

1. **Plan.** Decide which artifacts are needed (tables? actions? views? workflows? roles? agents? theme?). **Consider user roles only when 2+ distinct personas need different experiences** — see [roles](./roles/roles.md). Most apps need zero role artifacts.
2. **App name & description.** `artifacts/app.json` is **pre-seeded** from the live app before you run. Read the existing file first, then edit in place; do not treat it as missing. **Mandatory for new apps:** if the name is still a default placeholder (e.g. `"New App"`, `"Untitled"`) or the description is empty, you MUST set a specific, user-friendly name and a one-sentence description of what the app does (see [app](./app/app.md)) — never leave `{"name": "New App"}` as-is. For existing apps, update only on rename/retitle/describe requests.
3. **Theme.** For any styling/color/brand request **and for every new app**, load the **`theme`** skill and edit `src/theme.css`. Changes apply immediately in local dev and sync to the Blocks theme block on deploy. No `pnpm gen:types` needed for theme-only changes.
4. **Actions gate.** If backend logic is needed, you **MUST** discover available actions first: call **ListActions** with `actionSetIds: ["builtin"]` (plus any named integration's set), then **DescribeActions** for every action type you'll use. Never guess action schemas. Strongly prefer DAG actions; use code actions only as a last resort.
5. **Write the artifact JSON files** (tables, actions, views, workflows, roles, agents, agent-chats) per the sub-docs.
6. **Regenerate types.** After writing/updating/deleting any artifact, run **`pnpm gen:types`** so the frontend sees up-to-date types. This runs the bundled script at `scripts/generate-product-types.mjs` (auto-generated from `apps/compiler/src/modules/code-gen`), reads `artifacts/` and `src/pages/`, and writes `src/product-types.ts`.
7. **Verify entity exports.** Grep `src/product-types.ts` for `export const .*Entity`. Confirm every table and view the UI will use appears. Tables export `{TableName}Entity`; views export `{ViewName}Entity` the same way (see [views](./views/views.md)). **Never tell the frontend to import an entity that is not in this Grep output.**
8. **UI.** Build/adjust the React UI under `src/` (pages, components, layout) using **only verified exports**. The UI can call **only app actions** (not system/built-in actions).
9. **Code actions.** For every `type: "code"` action, implement `code-actions/<ActionName>/code.ts` and deploy it to Lambda (**DeployCodeAction**). Repeat until deployment succeeds.
10. **Build.** Run `pnpm build` and fix any errors.

### Tools available for this workflow

`ListActions`, `DescribeActions`, `TablesDescribe` (discover existing actions/tables and their schemas), `DeployCodeAction` (deploy a code action to AWS Lambda). After artifact changes, run **`pnpm gen:types`** to regenerate `src/product-types.ts` from `artifacts/`.

## Updating and deleting artifacts

- **Update:** to change an existing **action, code action, agent, table, or view**, write its artifact JSON with the **same name** — it is updated in place on sync (not duplicated). Tables diff their columns (add/update/remove) and patch metadata; views update query, description, and calculated columns.
- **Delete:** to remove a **table, view, action, code action, agent, agent-chat, or workflow**, delete its artifact JSON file from `artifacts/`. Sync removes blocks that no longer have a matching artifact file.

## Entity naming (tables and views)

Both table and view artifacts produce **`{Name}Entity`** exports in `src/product-types.ts` after **`pnpm gen:types`**:

- `artifacts/tables/Products.json` with `"name": "Products"` → `ProductsEntity`
- `artifacts/views/LowStockProducts.json` with `"name": "LowStockProducts"` → `LowStockProductsEntity`

**`pnpm gen:types` reads only `artifacts/`** — entity exports appear for artifacts you have written. The deploy build regenerates types from the synced Blocks store. Treat artifact sync errors as blocking; fix them before finishing.

**Derived UI data requires a view artifact.** Dashboard KPIs, joined rows, filtered lists, and rollups are views — not tables, and not invented entity names in the frontend prompt.

## Always-on rules

- **App name & description** (`artifacts/app.json`): pre-seeded from blocks-store — **mandatory for new apps**: replace a placeholder name (`"New App"`, `"Untitled"`) and fill in a missing description (step 2). For existing apps, update in place when name/description should change; skip only if the current values are already specific and correct.
- **Theme** is required for styling requests and every new app — load the **`theme`** skill and edit `src/theme.css` (step 3).
- **ListActions + DescribeActions** are mandatory before any action artifact (step 4).
- **`pnpm gen:types`** after any artifact change (step 6).
- **UI scope:** the frontend can call only this app's actions; system/built-in actions are not callable from the UI. Create an app action for any backend capability the UI needs.
- **Production-ready:** every feature must actually work — no mock data, placeholder buttons, or "coming soon". This is a real product for paying users.

## Related skills

- `theme` — brand palette, fonts, and `src/theme.css` (orchestrator-only; not an artifact).
- `integrations` — OAuth/API secrets and GetAppIntegrations (platform) or Settings → Integrations (git-sync). Load before integration-backed actions.
- `platform-knowledge` — answer questions about how the Blocks platform/app works (sharing, settings, billing, logout). Not for building.
- `app-layout`, `shadcn`, `blocks-client`, `charts`, `events-calendar`, `file-parsing`, `roles-and-authentication` — frontend (`src/`) skills used when building the UI.
