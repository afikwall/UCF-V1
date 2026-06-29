---
name: integrations
description: OAuth integrations and API secrets. Load IMMEDIATELY when a request involves any third-party service that needs credentials. FIRST step is always to read `artifacts/app.json` — only hand the user off to App Settings if the required provider/secret is missing there.
user-invocable: false
---

# Integrations

## Step 1 (MANDATORY) — read `artifacts/app.json` before anything else

The instant you realize the request touches a third-party service (Gmail, Slack, Google Calendar, Linear, Intercom, Stripe, a custom API key, etc.), your FIRST tool call MUST be a Read of `artifacts/app.json`. Do not send any handoff message, do not stop building, do not ask the user to open App Settings until after you have read this file.

`artifacts/app.json` contains:

- **`integrations`** — `[{ "provider": "gmail" }, …]` — OAuth providers **already connected** on this app in Blocks.
- **`secrets`** — `[{ "name": "MY_API_KEY" }, …]` — custom secrets **already configured** on the app.

## Step 2 — decide based on what's in `app.json`

Apply this decision tree to every provider and every secret the request needs:

- **All required providers/secrets are present in `app.json`** → continue the build normally. Do NOT hand off. Do NOT ask the user to open App Settings. Do NOT mention the integrations skill to the user. Just proceed: create artifacts, delegate to subagents, deploy.
- **At least one required provider/secret is missing** → go to Step 3 (handoff). Hand off only for the missing ones; if some are present and some are missing, list only the missing ones.

If you are about to send a "please connect X" message, you MUST first be able to point at `app.json` and show that `X` is not there. Sending the handoff without having read `app.json` first is a failure mode — this is the exact bug this skill exists to prevent.

`app.json` is a snapshot from the last sync from Blocks. After the user connects something new on the platform, they need to sync/push again before `app.json` reflects it.

## Step 3 — STOP and hand off (only if Step 2 says something is missing)

For providers/secrets that are missing from `app.json`, stop building immediately. Until the user confirms the missing integration is connected, do NOT:

- create or edit the action artifact
- write or update any code action under `code-actions/`
- delegate to the `frontend` or `backend-code-actions` subagent
- run `pnpm gen:types`
- call `DeployCodeAction` or any deploy tool

This applies even if you have already started other parts of the build — stop where you are and hand off.

## What to tell the user (and then wait)

Send one short, concrete message that names every missing integration and secret, then wait for the user's reply. Template:

> To build this I need the **<Integration Name>** integration connected on the Blocks platform first.
>
> 1. Open this app in Blocks → **App Settings → Integrations**.
> 2. Connect **<Integration Name>** (choose **Personal** or **Shared** based on whether it should be user-owned or app-wide).
> 3. Reply here once it's connected and I'll continue.

If multiple integrations or secrets are missing, list them all in this single message so the user only has to make one trip to the platform.

## Resuming after the user confirms

Only once the user replies that the missing integration is connected:

- Re-read `artifacts/app.json` if you have a fresh copy — confirm the provider/secret appears under `integrations` / `secrets`.
- Resume the normal artifact / code-action / frontend flow.
- Reference the integration by its provider name when wiring actions.

## Hard rules

- **Never ask for API keys, OAuth tokens, or secrets in chat.** Secrets are added by the user in **App Settings → Integrations** on the platform.
- **Public keys** (e.g. a Stripe publishable key used by client-side UI) MAY be collected in chat when appropriate.
- If you already started writing artifacts before realizing an integration was needed, stop, read `app.json`, and only hand off if the provider/secret is genuinely missing.

## When to load this skill

- The instant the request mentions a service that needs credentials (Gmail, Slack, Stripe, Google Calendar, Linear, Intercom, custom API keys, etc.) — even before exploring the codebase.
- Before creating any code action or integration-backed DAG action that needs OAuth or API secrets.
