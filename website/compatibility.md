# Compatibility

## Tailwind versions

- **v3 and v4** — The tool discovers `tailwind.config.{ts,js,cjs,mjs}` and uses Tailwind’s `resolveConfig` when available (v3-style API). If resolution fails, the raw config is used.
- **CSS-only config (v4)** — Projects without a JS config or with only `@config` in CSS still work; prefix and merge use defaults when resolved config is missing.

## Frameworks and file types

- **JS/TS/JSX/TSX** — Full AST parsing (Babel); class strings in `className`, `class`, and inside `classFunctions` (e.g. `clsx`, `cn`, `cva`, `tw`).
- **Vue, Astro, Svelte** — Adapters extract `class="..."` (and `class='...'`) from templates; analysis and fix run on those spans.

## Variant scope

Conflict detection and optimization suggestions (e.g. merge-axis) are evaluated **per variant scope**. For example:

- `md:pt-4` and `md:pb-4` can be suggested as `md:py-4`.
- `pt-4` and `md:pb-4` are not merged across scopes.
