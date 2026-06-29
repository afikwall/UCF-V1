# App Metadata Artifact

> Part of the [`app-artifacts`](../SKILL.md) skill. Read this before setting the app's name or description.

`artifacts/app.json` sets the **app's own name and description**. The app itself **always already exists** — this artifact only updates its metadata (via `updateApp`). It is a singleton (one file, not a directory) and is update-only: there is no create or delete.

`artifacts/app.json` is **pre-seeded** from the live app (name and description from blocks-store). Read the file first; do not recreate it from scratch.

**Mandatory for new apps:** when the seeded file still has a default placeholder name (e.g. `"New App"`, `"Untitled"`) or no description, you MUST update it with both:

- `name` — a short, specific, user-friendly app name. Use the name the user gave; otherwise derive one from what the app does (e.g. "Inventory Tracker", not "New App" or "My App").
- `description` — one sentence describing what the app does, written for the app's users.

Leaving `{"name": "New App"}` untouched on a new app build is a failure. For existing apps, update it in place when the user asks to name, rename, retitle, or (re)describe the app.

## File location

`artifacts/app.json` (single file at the root of `artifacts/`).

## JSON schema

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "description": "The app's display name" },
    "description": {
      "type": "string",
      "description": "Short, user-friendly description of what the app does"
    },
    "integrations": {
      "type": "array",
      "description": "Read-only snapshot of OAuth integrations already connected on the app (standalone/git-sync). Not synced — do not edit to add integrations.",
      "items": {
        "type": "object",
        "properties": {
          "provider": {
            "type": "string",
            "description": "Integration provider slug (e.g. gmail, slack)"
          }
        }
      }
    },
    "secrets": {
      "type": "array",
      "description": "Read-only snapshot of custom secret names already configured on the app. Not synced.",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Secret name (e.g. MY_API_KEY)"
          }
        }
      }
    }
  }
}
```

Both `name` / `description` are optional for updates; only the fields you set are sent to `updateApp`. **`integrations` and `secrets` are informational only** — connecting integrations happens in Blocks **App Settings → Integrations**, not by editing this file.

**Sync mapping:** On sync, artifact `name` → wf-actions `updateApp` input `appName`, and artifact `description` → `appDescription`. Use the friendlier artifact field names above; the platform API uses `appName` / `appDescription`.

## Example

```json
{
  "name": "Social Media Command Center",
  "description": "Plan, schedule, and track posts across all your social channels in one place."
}
```

No `pnpm gen:types` is needed for app metadata (it doesn't affect `product-types.ts`).
