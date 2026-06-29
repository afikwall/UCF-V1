# Agent Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating/updating/deleting an agent.

An agent is a reusable AI persona that can be invoked from a **SendAgentMessage** DAG node or attached to an agent-chat. Define each as `artifacts/agents/<Name>.json`. After changes, run **`pnpm gen:types`**.

## `name` — stable functional identifier

`name` is a **stable identifier that must never be modified once the agent exists**. Use a functional, role-based PascalCase name that describes what the agent does — e.g. `SupportAgent`, `SalesRepresentative`, `OnboardingGuide`, `ResearchAssistant`. Do **not** pick from a preset list and do **not** use persona/person names.

- It is the artifact filename and the value used for cross-referencing from agent-chats, DAG nodes (`agentBlockId`), and `editAgent`.
- **Never rename an existing agent.** To update an agent, keep its `name` (and filename) exactly as-is and edit the other fields — this updates it in place. Changing `name` is **not** a rename: it is treated as deleting the old agent and creating a new one, so you lose its history and break every reference (agent-chats, DAG `agentBlockId`, subagents).
- If the user asks to "rename" an agent, change its display via other fields (e.g. `jobTitle`) — do **not** change `name`.

The backend assigns the visual persona (photo, avatar, intro video, voice) automatically — you don't choose it.

## `title` — display name of the persona

`title` is the display name of the persona the backend picks for new agents. **Never set `title` when creating a new agent** — leave it out. It is returned on future runs (via app describe) once a persona has been picked, and seeded back into the artifact. When it is present on an existing artifact, leave it as-is unless rename is asked.

## File location

`artifacts/agents/<Name>.json` — e.g. `SupportAgent.json` (filename matches the functional `name` inside the JSON).

## JSON schema

```json
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Stable functional identifier (PascalCase role name, e.g. \"SupportAgent\", \"SalesRepresentative\"). Never changes. Also the artifact filename. Used for cross-referencing from agent-chats / DAG nodes / editAgent."
    },
    "title": {
      "type": "string",
      "description": "Display name of the persona assigned by the backend. Do NOT set this on new agents — it is returned/seeded on future runs once a persona is picked."
    },
    "instructions": {
      "type": "string",
      "description": "System / persona instructions describing behavior and goals"
    },
    "jobTitle": {
      "type": "string",
      "description": "Short role title, e.g. \"Support Specialist\""
    },
    "memoryEnabled": {
      "type": "boolean",
      "description": "Long-term memory"
    },
    "skillBlockIds": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Skill instance block ids"
    },
    "subAgentBlockIds": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Agent block ids to use as subagents"
    },
    "tools": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["actionTypeId"],
        "properties": {
          "actionTypeId": {
            "type": "string",
            "description": "Action tool type id from ListActions / app describe"
          }
        }
      }
    },
    "knowledge": {
      "type": "array",
      "items": { "type": "object" },
      "description": "Context entries stored on the agent (e.g. { url } or { dataBlockId })"
    }
  }
}
```

## Update & delete

- **Create:** pick a stable functional `name` (same value as the artifact filename). Do not set `title`.
- **Update:** write the artifact with the **same `name`** as an existing agent → it is updated in place (editAgent). The `name` must **never** be modified — keep both `name` and the filename unchanged. Keep any existing `title` untouched.
- **Delete:** remove the artifact file from `artifacts/agents/` to delete the agent on sync.

After any agent change, run **`pnpm gen:types`**.
