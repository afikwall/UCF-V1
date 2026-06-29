---
name: platform-knowledge
description: Facts about the Blocks platform itself — how builders and end users navigate, share/publish apps, manage settings, roles, billing/plans, the activity log, and logout behavior. Load this skill when the user asks how the platform or their app works ("how do I share this?", "where do I change the theme?", "how do users log in?") rather than requesting an app build change.
user-invocable: false
---

# Blocks Platform Knowledge

Use this to answer questions about how the Blocks platform and a built app work. It is reference knowledge, not a build instruction — most questions are answered without any tool calls.

## What Blocks is

Blocks is an AI app builder where users create custom work tools without coding by chatting with the assistant (Ella). Apps run inside the Blocks workspace, which provides authentication, hosting, user management, and sharing automatically.

Apps are accessed two ways:

- **Inside Blocks (preview/iframe):** builders/team members view the app embedded in the platform, authenticated with their Blocks account.
- **Outside Blocks (standalone):** opened at the app's own URL `{APP_ID}.blocks-app.diy` in its own tab — how external users access it, running independently of the platform.

## Builder sections (3-icon menu next to the app name, top left)

- **Design:** all app pages; the app **Theme** (colors, fonts — editable manually here); **View as** a role (if the app has roles) to preview each persona's experience.
- **Logic:** all agents & actions and how each works (prompts, tools, knowledge for agent actions/chats); when each is triggered (UI, scheduling, integration triggers).
- **Data:** all tables with columns & items; add/update/delete items manually.

## Sharing ("Invite & Share", top right)

1. **Team members** (Team Members → Add by email) — collaborate on all account apps; can create/manage apps.
2. **External users to one app** (Publish → Private) — log in by email, access only that app standalone. Choose "Only invited users can login" (invite by email) or "Anyone with the link can login" (share `{APP_ID}.blocks-app.diy`; users self-sign-up).
3. **Public app** (Publish → Public) — share the link; choose "All content is public", "Invited users can login to restricted parts", or "Anyone can login to restricted parts".
4. **Embed** (Publish → Embed → Copy code) — iframe with source `{APP_ID}.blocks-app.diy?embedded=true`.

After inviting, the inviter can set the invitee's role if the app has roles.

## Activity log (Pulse icon, top right)

Shows data events (insert/update/delete of table items) and logic events (actions with inputs & outputs).

## App settings (gear icon, top right)

1. **General** — app name, description, cover image, duplicate the app.
2. **App permissions** — private/public (as in Invite & Share), default page for external link, per-table permission (private, public read, public write, public).
3. **Integrations** — per integration, set connection scope ("share with all app users" vs "personal connection — each user connects their own"). Each workflow action can override the app-level connection in its settings panel under "Connection" (block `data.connectionId`); if unset, the app-level connection is used.
4. **Customizations** — Custom domain (Pro+); Email brand (sender name, logo, title, subject lines for invite emails).
5. **Delete** — delete the app.

## Avatar menu (bottom left)

My profile (name, email, photo); Admin (account name, logo); Billing (change plan, builder messages & usage credits, invoices).

## Platform menu (blue left bar)

Top: My workspace (all account apps), New app, Marketplace (pre-built templates). Bottom: Team, Support (real person), Book a Demo.

## Plans & pricing

There are 5 plans; each includes the previous ones' features. Users can top up builder messages and usage credits (credits are consumed by app usage — LLM requests, integrations & tools). **Never quote prices or discuss specific plans** — direct the user to the pricing page instead.

## Logout behavior

- **Inside Blocks (preview/iframe):** logout is disabled by design (logging out would sign the user out of Blocks entirely). The UI explains: open the app in a separate tab to log out of just the app.
- **Outside Blocks (standalone tab):** logout works normally without affecting the Blocks account. This is where logout should be tested.

## Undo

A user can revert to a point in time via "Undo" below their corresponding chat message — this reverts all changes from that point (data structure, logic, and UI).

## Answering style

Keep platform answers short, friendly, and non-technical (avoid "compilation", "tables", "blocks"). Use clickable markdown links for any URLs.
