# Tailwind Architect

**AST-first tooling** for safe Tailwind CSS class analysis, sorting, conflict detection, and refactoring.

## Why Tailwind Architect?

- **Sort** — Consistent semantic order (layout → spacing → typography → visual).
- **Remove redundancy** — Drop overridden utilities so classes stay minimal.
- **Detect conflicts** — Find impossible combinations and overrides.
- **Suggest optimizations** — e.g. merge `pt-4` + `pb-4` → `py-4` (within variant scope).
- **Duplicate patterns** — See repeated class patterns across files to extract components or utilities.
- **Multi-framework** — JS/TS/JSX/TSX, Vue, Astro, Svelte via adapters.
- **Plugins** — Custom lint rules, sort groups, and suggestions.

Use it via **CLI** (`analyze`, `fix`, `lint`) or the **VSCode/Cursor extension** (diagnostics, quick fix, format on save, fix workspace).

## Installation

```bash
npm install -D tailwind-architect
```

Or run without installing:

```bash
npx tailwind-architect analyze .
```

## Next

- [Quick start](/quick-start) — Run your first analysis and fix.
- [CLI reference](/cli) — All commands and flags.
- [Configuration](/configuration) — `tailwind-architect.config.json` and plugins.
- [VSCode extension](/extension) — Commands and settings.
