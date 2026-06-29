---
name: theme
description: Authoring and updating src/theme.css — the app's brand palette, fonts, radius, and shadows. Load this skill for ANY styling, color, branding, dark/light mode, or look-and-feel request, and for every new app. Orchestrator-only — the frontend agent must not edit theme.css.
user-invocable: false
---

# Theme (src/theme.css)

`src/theme.css` is the live theme file for this app. It is imported by `src/index.css`, so edits apply immediately in local `pnpm dev` (Vite HMR). On sync, the platform reads this file and persists the palette to the Blocks theme block. For any styling/color/brand request, and for every new app, edit this file directly.

## File location

`src/theme.css` (CSS file, not JSON).

Optional first line for palette notes (synced to the theme block):

```css
/* @themeDescription: Cool professional blue palette, minimal and high-contrast. */
```

## CSS structure

Two blocks — light and dark — using CSS custom properties Tailwind reads via `hsl(var(--token))`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  /* …other tokens… */
  --radius: 0.5rem;
  --font-sans: Sora, ui-sans-serif, system-ui, sans-serif;
  --shadow-color: 222 47% 11%;
  --shadow-opacity: 0.1;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-offset-x: 0;
  --shadow-offset-y: 1px;
  /* computed shadows (--shadow-sm, etc.) are auto-generated — do not edit manually */
}

:root.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  /* …mirror light tokens for dark mode… */
}
```

### CRITICAL: color format in CSS

Color tokens use **space-separated HSL components without `hsl()`** — e.g. `221 83% 53%`, not `#2563EB` and not `hsl(221 83% 53%)`. Tailwind wraps them as `hsl(var(--primary))`.

Non-color tokens use natural CSS units: `0.5rem`, `0em`, font-family strings, etc.

### Color token keys

`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, `chart-1`, `chart-2`, `chart-3`, `chart-4`, `chart-5`, `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`.

Contrast pairs: many tokens have a `-foreground` counterpart for text on that surface (`primary`/`primary-foreground`, etc.). Keep every pair WCAG AA (4.5:1).

### Non-color token keys

- **Typography:** `--font-sans`, `--font-serif`, `--font-mono` — font-family strings (e.g. `Sora, sans-serif`). Prioritize `--font-sans` (shadcn default).
- **Shape:** `--radius` — global border-radius (e.g. `0.5rem`; `0rem` for sharp corners).
- **Shadows (source vars only):** `--shadow-color`, `--shadow-opacity`, `--shadow-blur`, `--shadow-spread`, `--shadow-offset-x`, `--shadow-offset-y`. The platform derives `--shadow-sm`, `--shadow-md`, etc. from these — leave computed shadow vars unchanged.
- **Rhythm:** `--letter-spacing`, `--spacing`.

### Typography guidance

- Match font personality to the app's purpose (modern/clean, elegant/serif, playful/rounded). Avoid lazy defaults.
- Good options: Bricolage Grotesque, Work Sans, Montserrat, Sora, Outfit, Poppins, Arimo, Raleway.
- Multi-language: Hebrew (Open Sans, Heebo), Arabic (IBM Plex Sans Arabic), CJK (Noto Sans JP/KR/SC), Cyrillic (Golos Text). Any Google Font is allowed if it exists.

## Color selection (derive from the app's purpose)

- B2B / admin tools → neutral grays or slate blues
- Healthcare / finance → conservative blues or greens
- Creative / consumer → vibrant, purposeful accents
- Food / lifestyle → warm ambers, earthy reds, sage greens
- Do **not** default to purple/indigo/violet unless the app explicitly calls for it.

Roles: `primary` = main interactive color; `secondary`/`muted`/`accent` = low-saturation variants; `chart-1..5` = 5 distinct accessible colors on white cards; `sidebar` = slightly offset from background.

Principles: one primary accent used strategically; prefer bold/saturated accents (70–90%); subtle radius (0.375–0.5rem); transitions 150–200ms. Default to a clean Scandinavian aesthetic, but user preferences always win (heavy shadows, tight spacing, bold everywhere → do it). Avoid white-on-white/poor contrast, predictable blue-gray, and everything competing for attention.

## User-intent translation

- "Make it [color]" → modify brand colors only.
- "Background darker/lighter" → modify surface colors only.
- Specific token requests → change those tokens + their direct `-foreground` pairs.
- "Change [colors] in light/dark mode" → change only that mode's block (`:root` or `:root.dark`); leave the other unchanged.
- "Like [brand]" → extract essence (Spotify = dark + green accent; Apple = extreme minimal).

## Dark mode

Mirror the brand hue, invert luminance: `--background` → near-black HSL; `--card` slightly lighter; `--primary` slightly lighter/more saturated; `--foreground` near-white. Ensure every foreground/background pair meets WCAG AA (4.5:1).

## Example

```css
/* @themeDescription: Cool professional blue palette, minimal and high-contrast, slightly rounded corners. */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --radius: 0.5rem;
}

:root.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
}
```

After editing `src/theme.css`, build the UI (it uses semantic tokens like `bg-primary`; it does not set the palette). No `pnpm gen:types` step is needed for theme-only changes.

## Related skills

- `app-artifacts` — backend JSON artifacts (tables, actions, views, etc.); theme is **not** an artifact.
- `shadcn` — frontend token **usage** in components (`bg-primary`, etc.); frontend agent must not edit `src/theme.css`.
