# Agent Chat Artifacts

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before creating an agent-chat. A chat needs an agent — see [agents](../agents/agents.md).

An agent-chat is the chat UI surface that talks to an agent persona. Define each as `artifacts/agent-chats/<Name>.json`. **Instructions and tools live on the agent, not the chat** — create the agent first (see [agents](../agents/agents.md)) and give it the instructions and tools it needs, then attach a chat to it via `agentId`. The chat artifact only carries welcome copy, first-run prompt, and UI flags. After changes, run **`pnpm gen:types`**.

## File location

`artifacts/agent-chats/<Name>.json` — e.g. `SupportChat.json`.

## JSON schema

Matches wf-actions `CreateAgentChatData` / `describeCreateAgentChat` input (with `agentId` renamed from `agentBlockId` for artifact readability).

```json
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": { "type": "string", "description": "Agent chat name" },
    "agentId": {
      "type": "string",
      "description": "Agent to attach this chat to: artifact agents file key (e.g. Support), agent artifact `name`, or an existing agent block id. Sync resolves to the block created for that agent in the same run. If omitted, the sole manifest agent or first app agent is used."
    },
    "initialMessages": {
      "type": "array",
      "description": "Static messages shown when the chat opens",
      "items": {
        "type": "object",
        "required": ["content"],
        "properties": {
          "content": { "type": "string", "description": "Message content" }
        }
      }
    },
    "initialPrompt": {
      "type": "object",
      "description": "Prompt sent to the model on first open",
      "properties": {
        "content": {
          "type": "string",
          "description": "Visible prompt content"
        },
        "hiddenContent": {
          "type": "string",
          "description": "Hidden prompt content (not shown to the user)"
        }
      }
    },
    "isPersistent": {
      "type": "boolean",
      "description": "Whether chat history persists across page reloads"
    },
    "hideToolsUi": {
      "type": "boolean",
      "description": "Whether to hide internal tool activity rows in the chat UI"
    },
    "disableGeneratingDynamicChatComponent": {
      "type": "boolean",
      "description": "Whether to disable the generate_dynamic_chat_component tool"
    },
    "disableAttachments": {
      "type": "boolean",
      "description": "Whether to disable attachments for this chat"
    }
  }
}
```

## Rules

- Set the **agent's** `instructions` and `tools` (on the agent artifact) to match the functionality the user asked for — the chat inherits them from the linked agent.
- Whenever the agent must read from or write to app tables, give the **agent** the relevant **table tools**, describe their use in the agent's `instructions`, and ensure the relevant `itemId` is passed as context from the UI.

## Notes

- Instructions, tools, and description are **not** persisted on the chat block — they come from the linked agent. Set them on the **agent** artifact; use the chat artifact for `initialMessages`, `initialPrompt`, UI flags (`isPersistent`, `hideToolsUi`, etc.), and `agentId`.
- Agent-chat artifacts are synced to blocks: a chat block is created (or updated/deleted) in the app alongside type generation, so the generated type references a real block.

After any agent-chat change, run **`pnpm gen:types`**.
