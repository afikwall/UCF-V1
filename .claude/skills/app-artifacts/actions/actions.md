# Action Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating/updating/deleting an action.

Define backend logic as JSON files under `artifacts/actions/<Name>.json` (one file per action). On sync these become real action blocks — **both** `type: "dag"` (visual workflow) and `type: "code"` (Lambda TypeScript) are supported. After writing/changing action artifacts, run **`pnpm gen:types`**.

## Mandatory gate (do this first)

### Before any action artifact

Call **ListActions** with at least `actionSetIds: ["builtin"]` (plus integration sets when relevant) to see what built-ins already exist. **Never guess** action or schema shapes.

### Before a DAG action (`type: "dag"`)

You **MUST** also call **DescribeActions** for every built-in action type you will use as a node. DAG artifacts reference `actionTypeId` values and node input schemas from those describes.

### Before a code action (`type: "code"`)

1. Confirm via **ListActions** that no built-in integration or DAG of built-ins can do the job (code is last resort — see below).
2. Write the artifact with `"type": "code"` using the **[Code action JSON schema](#code-action-json-schema-type-code)** below. Fields match **`CreateCodeActionData`** in the platform (`createCodeAction` API) — the artifact sync creates the code-action block; you then implement `code-actions/<Name>/code.ts` and **DeployCodeAction**.
3. Load the **`integrations`** skill when the action needs OAuth/API secrets.
4. You do **not** need DescribeActions for built-in node types when creating a code action (there are no DAG nodes).

## Integrations

Many built-in actions belong to integration action sets (Gmail, Slack, Google Calendar, Stripe, etc.). Guidance:

- **Prefer available actions.** If the user didn't name a specific integration, use the built-in/app actions that already fulfill the need rather than introducing a new integration.
- **Ambiguous service → ask first.** "Email" could be Gmail/Outlook; "calendar" could be Google/Outlook. If the request is ambiguous about which service, ask the user to pick before building around an integration.
- **Only when the user explicitly names an integration** should you design around it. Pass `actionSetIds` for that integration to **ListActions** to discover its actions.
- **Credentials required:** load the **`integrations`** skill before creating integration-backed or code actions that need OAuth or secrets.
- LinkedIn profile/company/picture/URL lookups do **not** require the LinkedIn integration.

## Choosing action type: DAG strongly preferred over code

Evaluate top-to-bottom; stop at the first match:

1. **CRUD / data / notifications / integrations** (GetItems, InsertItems, UpdateItems, DeleteItems, SendEmail, Slack, HTTP, …) → **DAG** with built-in action nodes. This is the default for the vast majority of actions.
2. **LLM / agent / reasoning / "AI that uses tools" / context-dependent decisions** → **DAG**, never a code action. Choose between two nodes (see [Agent calls](#agent-calls-ai--reasoning-sendagentmessage-vs-agentcall) below):
   - **Agent + SendAgentMessage (preferred).** Create an agent artifact first (see the **`agents`** skill), then call it from a **SendAgentMessage** node. Calling by name auto-loads the agent's full configuration (instructions, tools, memory, knowledge, skills, harness). Prefer this whenever the task is more than a trivial one-off, when the same persona is reused across actions, or when the app also needs an agent-chat.
   - **AgentCall (simple LLM call only).** Use a single **AgentCall** node only when you are certain you need a very simple, one-off LLM call with no reusable persona, tools, or memory.
3. **Custom external API with NO built-in integration** → **Code** action — last resort only, after confirming via ListActions that no DAG can do the job.

## File location

`artifacts/actions/<Name>.json` — e.g. `ProcessOrder.json`, `SendNotification.json`. Name must be globally unique. Do **not** suffix the name with "Action".

## DAG action JSON schema (`type: "dag"`)

```json
{
  "type": "object",
  "required": [
    "name",
    "type",
    "description",
    "iconName",
    "inputSchema",
    "output",
    "exposedToUI",
    "actionNodes",
    "edges"
  ],
  "properties": {
    "name": { "type": "string", "description": "Unique action name" },
    "type": { "const": "dag" },
    "description": { "type": "string" },
    "iconName": {
      "type": "string",
      "description": "Lucide icon name (e.g. send, mail, database)"
    },
    "exposedToUI": {
      "type": "boolean",
      "description": "true only if the UI must call this action"
    },
    "inputSchema": {
      "type": "object",
      "description": "JSON Schema for action input. EVERY {{input.X}} used in any node must be declared here. Use required/default as needed."
    },
    "output": {
      "type": "string",
      "description": "Name of the node whose result is the action output"
    },
    "actionNodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "actionTypeId", "input"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Node name — must be globally unique in the app (do not reuse other action, node, or system action names)"
          },
          "actionTypeId": {
            "type": "string",
            "description": "From ListActions/DescribeActions"
          },
          "input": {
            "type": "object",
            "description": "Node input; use {{input.X}} or {{PreviousNodeName.field}} variables"
          },
          "forEach": {
            "type": "object",
            "required": ["items"],
            "properties": {
              "items": {
                "type": "string",
                "description": "Array variable to iterate, e.g. {{input.orders}}"
              },
              "itemVariable": { "type": "string", "default": "item" },
              "indexVariable": { "type": "string", "default": "index" },
              "onError": {
                "enum": ["fail", "continue"],
                "default": "fail",
                "description": "When an iteration fails: fail the node or continue"
              }
            }
          }
        }
      }
    },
    "conditionNodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "conditionExpression"],
        "properties": {
          "name": { "type": "string" },
          "conditionExpression": {
            "type": "string",
            "description": "Expression WITHOUT {{}}, e.g. input.amount > 100 (boolean) or input.status (switch)"
          }
        }
      }
    },
    "mergeNodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string" },
          "waitMode": { "enum": ["all", "first"], "default": "all" },
          "inputMapping": {
            "type": "object",
            "description": "{ field: \"{{NodeA.result}}\" }"
          }
        }
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "source", "target"],
        "properties": {
          "name": { "type": "string" },
          "source": { "type": "string", "description": "Source node name" },
          "target": { "type": "string", "description": "Target node name" },
          "label": {
            "type": "string",
            "description": "Required for edges from condition nodes: true/false or a switch value"
          }
        }
      }
    }
  }
}
```

## Code action JSON schema (`type: "code"`)

Matches **`CreateCodeActionData`** / `createCodeAction` in wf-actions. Sync creates the code-action block from this JSON; implementation lives in `code-actions/<Name>/code.ts`.

**Required fields:** `name`, `type`, `description`, `iconName`, `inputSchema`, `outputSchema`, `secrets`, `exposedToUI`. Use `"secrets": []` when the action needs no app secrets.

```json
{
  "type": "object",
  "required": [
    "name",
    "type",
    "description",
    "iconName",
    "inputSchema",
    "outputSchema",
    "secrets",
    "exposedToUI"
  ],
  "properties": {
    "name": {
      "type": "string",
      "description": "Unique action name (same as the artifact filename without .json)"
    },
    "type": { "const": "code" },
    "description": {
      "type": "string",
      "description": "What the action does. Include trigger/context and where output is stored (e.g. table/column) when relevant."
    },
    "iconName": {
      "type": "string",
      "description": "Lucide icon name (e.g. code, globe, send). Must exist in the Lucide set."
    },
    "exposedToUI": {
      "type": "boolean",
      "description": "true only if the UI calls this action; false for backend/workflow-only actions"
    },
    "inputSchema": {
      "type": "object",
      "description": "JSON Schema for action input. Declare every field the invoke function reads. Use required/default as needed."
    },
    "outputSchema": {
      "type": "object",
      "description": "JSON Schema describing the action output (shape returned from invoke)"
    },
    "secrets": {
      "type": "array",
      "description": "App secret names available to the action at runtime via context.secrets. Use [] when none.",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Secret name (e.g. MY_API_KEY). Must exist in app secrets or integrations."
          }
        }
      }
    },
    "browsingTask": {
      "type": "boolean",
      "description": "Optional. Set true when the action browses/scrapes web pages. Runtime provides Playwright + Browserbase (and optionally Stagehand) via the third invoke argument."
    }
  }
}
```

### Example code action artifact

`artifacts/actions/FetchPageTitle.json`:

```json
{
  "name": "FetchPageTitle",
  "type": "code",
  "description": "Fetches a page title from a URL passed in input.url",
  "iconName": "globe",
  "exposedToUI": false,
  "inputSchema": {
    "type": "object",
    "required": ["url"],
    "properties": {
      "url": { "type": "string", "description": "Page URL to fetch" }
    }
  },
  "outputSchema": {
    "type": "object",
    "required": ["title"],
    "properties": {
      "title": { "type": "string" }
    }
  },
  "secrets": [],
  "browsingTask": true
}
```

### After creating the artifact

1. Run **`pnpm gen:types`**.
2. Implement **`code-actions/<ActionName>/code.ts`** (delegate to **backend-code-actions**).
3. **DeployCodeAction** for that action name. Repeat until deployment succeeds.

Never create a code action for CRUD, LLM/agent calls, emails/notifications, or anything a DAG of built-ins can do.

## Variables (DAG node inputs & condition expressions)

- Always double braces: `{{ ... }}`. Inside must be a single valid JS expression (no statements/assignments). Valid: `{{input.name}}`, `{{GetOrders.orders}}`, `{{input.amount > 100}}`, `{{new Date().toISOString()}}`. Forbidden: `const`/`let`/`var`, IIFEs, multi-statement, assignment, undefined globals. Do not escape braces (`{{{{...}}}}`).
- Sources: `input.*` (declared in inputSchema) and `PreviousNodeName.*` (output of an earlier node, by literal node name). Don't mix them up.
- Condition expressions use NO braces: `input.amount > 100`, `input.status`.
- Every required property of a node's action type must be set (constant or variable).

### No IIFEs / arrow functions / multi-step logic in an expression (hard rule)

A variable or condition expression is **one** JS expression, not a function body. **Immediately-invoked function expressions (IIFEs) and user-defined arrow functions are NOT supported** and will fail at runtime with: `User-defined arrow functions (IIFE) are not supported`.

So you may **not** declare locals (`const`/`let`), write `return`, or chain multiple statements to compute a value. Forbidden example (this is exactly what fails):

```js
// ❌ INVALID — IIFE used as a variable expression
{
  {
    (() => {
      const pids = new Set(GetProducts.items.map((p) => p.id));
      const lines = GetLines.items.filter((l) => pids.has(l.productId));
      /* ... */ return Math.round(score * 10) / 10;
    })();
  }
}
```

Note: array-method callbacks like `.map(p => p.id)` / `.filter(l => …)` are fine — the ban is on wrapping your whole computation in a function (IIFE/arrow) to get statements + `return`.

To compute something this complex, choose one:

1. **Break it into DAG nodes** — do each step (filter, join, aggregate) as its own action node and reference the previous node's output. This is strongly preferred.
2. **Use a single composed expression** — rewrite as one expression with no locals/return, e.g. chain `.filter(...).map(...).reduce(...)` and use ternaries instead of `if`/`return`.
3. **Use a code action** (`type: "code"`) — last resort, only when the logic genuinely cannot be a DAG. There you write real multi-statement TS in `code-actions/<Name>/code.ts` and deploy to Lambda.

## When NOT to create an action

The UI code **already has direct data operations** (insert/update/delete/query) for every table. Do **not** create actions whose only purpose is CRUD from the UI — leave that to the frontend. Likewise, do **not** create actions for user operations or role changes (handled in the UI/platform). Create actions for genuine backend logic: integrations, notifications, AI/agent calls, multi-step orchestration, scheduled/triggered work, or anything the UI cannot do directly.

## UI scope (critical)

The UI can only call **app** actions (those in this app). System/built-in actions are NOT callable from the frontend and will fail. For any backend capability the UI needs, create an app action (DAG or code) first. Set `exposedToUI: true` only for actions the UI calls; backend/workflow-only actions stay `false`.

## Agent calls (AI / reasoning): SendAgentMessage vs AgentCall

Two DAG nodes add AI to an action — pick based on how much capability you need:

- **SendAgentMessage (preferred).** Sends a message to a **named agent already defined in the app** (an artifact under `artifacts/agents/`, see the **`agents`** skill), automatically loading all of its configuration — instructions, tools, memory, knowledge, skills, and harness. **Always prefer an agent + SendAgentMessage over a bare LLM call** unless you are certain the task is very simple. The same agent can be reused from multiple actions and from an agent-chat. **You MUST create the agent first** before you can call it via SendAgentMessage (and an agent is also required if the app needs an agent-chat). Workflow: create the agent artifact → run `pnpm gen:types` → reference it from a SendAgentMessage node.
- **AgentCall (simple LLM call).** A single `AgentCall` node inside a DAG action, for a one-off LLM call with no reusable persona/tools/memory. Use only when a simple call is genuinely enough.

The guidance below applies to **both** nodes:

- **Provide everything the agent needs**: all required `tools` (action type ids) AND a comprehensive prompt with full context and a clear goal. An agent expected to write to a table MUST be given a table-write tool, or it fails. A backend-triggered call MUST have a tool to store or send its result — otherwise its textual output is lost. (With SendAgentMessage, the agent's own configured tools also apply.)
- **Files** passed to the call MUST be in the node input's `files` array (e.g. `"files": [{ "url": "{{input.fileUrl}}" }]`), or the model won't process them and the action fails.
- **Performance:** an AI call can take up to ~1 minute. Never run one on page load. Prefer plain UI JS (or simple data ops) for calculations/CRUD. For slow/expensive AI work, run it via a background trigger (Scheduler/DataEvent workflow) and persist results to a table; let the user refresh, or refresh based on result age.

## Files handling

Internal file URLs are not accessible outside the system. When a file URL is sent to the outside world (email body, upload to a drive, etc.), generate a signed URL first (GenerateFileSignedUrl) and use that instead of the internal URL.

## Update & delete

- **Update:** write the artifact with the **same name** as an existing action → it is updated in place (editAction/editCodeAction), not duplicated.
- **Delete:** remove the artifact file from `artifacts/actions/` to delete the action on sync.

After any action change, run **`pnpm gen:types`**.
