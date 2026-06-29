---
name: custom-dependencies
description: Adding an npm library this app needs that the boilerplate doesn't already ship. Load ONLY when the app genuinely requires a package beyond the preinstalled set (React, the shadcn/ui primitives, Recharts, calendars, date utils, etc.) — most apps never need this. Covers `pnpm add`, how the dependency round-trips and re-installs at compile, and verifying a library's real exports before importing.
user-invocable: false
---

# Custom npm dependencies

The boilerplate already ships React, the shadcn/ui primitives, charts (Recharts), calendars, date utils, and more — **check before adding**. Only reach for a new library when the app genuinely needs one that isn't preinstalled.

## Adding a package

Run `pnpm add <package>`. It installs into this app's **isolated per-app `node_modules`** (built from the shared pnpm store, so nothing leaks between apps) and updates `package.json`, so you can import and build-verify it right here.

The `package.json` change **round-trips to the platform**: on sync it's saved as the app's `package_json` block, and the next platform compile re-installs the deps before the build, so your imports resolve there too. (If `pnpm add` can't reach the registry in your environment, declare the dep in `package.json` directly — it still installs at the platform compile.)

## Rules

- **Pick maintained, ESM-first, pure-JS libraries.** Native binaries and packages that need postinstall/build scripts do NOT work (installs run with `--ignore-scripts`). CommonJS libraries are supported, including ones that `require` react and other provided globals.
- **Verify the library's REAL exports before importing — never assume.** A wrong import is the #1 cause of an app that builds fine but blanks out at runtime (`Element type is invalid`, `does not provide an export named 'X'`). After `pnpm add`, check what it actually exports (`node -e "import('<pkg>').then(m => console.log(Object.keys(m)))"` or read its installed types/README), then run `pnpm build` to confirm it resolves. Library APIs change between major versions — don't import from memory.
- **Add, don't remove.** Don't delete or downgrade the boilerplate's own deps/scripts/tooling — the platform merges your deps onto the boilerplate (yours win on conflicts).
