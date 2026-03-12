# Tailwind Architect

[![Build](https://github.com/vitoriowingert/tailwind-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/vitoriowingert/tailwind-architect/actions/workflows/ci.yml)
[![npm (scoped)](https://img.shields.io/npm/v/tailwind-architect.svg)](https://www.npmjs.com/package/tailwind-architect)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AST-first tooling for safe Tailwind class analysis and refactoring.

**Docs:** [Guide](https://vitoriowingert.github.io/tailwind-architect/) (or run `website/` locally with VitePress).

## Packages

- `@tailwind-architect/core`: analysis + transformation engine
- `tailwind-architect`: CLI (`analyze`, `fix`, `lint`)
- `tailwind-architect-vscode`: VSCode/Cursor extension (diagnostics, quick fix, Fix Classes, Fix Workspace, optional format on save and span-level diagnostics)

## Quick start

```bash
npm install
npm run build
node packages/cli/dist/cli.js analyze
```

## Configuration

Create `tailwind-architect.config.json` at repository root:

```json
{
  "sortClasses": true,
  "removeRedundant": true,
  "detectConflicts": true,
  "readabilityMode": false,
  "autoFix": true,
  "classFunctions": ["clsx", "cn", "cva", "tw"],
  "plugins": []
}
```

## CLI

```bash
tailwind-architect analyze [path]
tailwind-architect fix [path] [--dry-run]
tailwind-architect lint [path]
```

Options:

- **`[path]`** — Directory to scan (default: current directory).
- **`--max-workers N`** — Max concurrent file operations (default: CPU count).
- **`--dry-run`** — For `fix`: compute changes but do not write files.
- **`--report json`** — Output machine-readable JSON (see [docs/ci.md](docs/ci.md) for full schema).
- **`--output <path>`** — Write the JSON report to a file (e.g. `tailwind-report.json`). Can be used with or without `--report json`.
- **`--detailed`** — Include per-file details (conflicts, suggestions, redundant classes with locations) in the JSON report.

Examples:

```bash
# Basic human-readable report
tailwind-architect analyze .

# JSON report to stdout (for scripts / CI)
tailwind-architect analyze . --report json

# Full report written to a file, including the list of all scanned files
tailwind-architect analyze . --output tailwind-report.json

# Detailed per-file log (conflicts, suggestions, redundantRemoved, plugin lints)
tailwind-architect analyze . --output tailwind-report.json --detailed
```

**Exit codes:** `lint` exits with `1` when there are issues (conflicts, redundancy, suggestions, or parse errors); otherwise `0`. Use in CI to fail the build. See [docs/ci.md](docs/ci.md) for examples.

## Compatibility

- **Tailwind v3 and v4:** The tool resolves `tailwind.config.{ts,js,cjs,mjs}` and uses Tailwind’s `resolveConfig` when available (v3-style API). If resolution fails, the raw config is used. Projects without a config or with CSS-only config (e.g. v4 `@config`) still work; prefix and merge use defaults when resolved config is missing.
- **Frameworks:** Parsing supports JSX/TSX (React, Next.js), and class strings inside `clsx`, `cn`, `cva`, and `tw` (configurable). Other frameworks (Vue, Astro, Svelte) may be added via adapters.

**Variant scope:** Conflict detection and optimization suggestions (e.g. merge-axis) are evaluated per variant scope. For example, `md:pt-4` and `md:pb-4` can be suggested as `md:py-4`; `pt-4` and `md:pb-4` are not merged across scopes.

## Versioning and releases

Releases follow [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for history.

**Publishing:** Create a GitHub Release to trigger the [publish workflow](.github/workflows/publish.yml). It runs tests and lint, then publishes `@tailwind-architect/shared`, `@tailwind-architect/core`, and `tailwind-architect` to npm via **Trusted Publishing (OIDC)** (no `NPM_TOKEN`). The VSCode extension is built and packaged; set `VSCE_TOKEN` in repo secrets to publish to the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vitoriowingert.tailwind-architect-vscode). See [CONTRIBUTING.md](CONTRIBUTING.md).

**Community:** After release, you can share the tool on Reddit (e.g. r/webdev), Twitter/X, or Product Hunt.

**Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for build, test, and plugin development. Demo content (e.g. “10 Tailwind mistakes this fixes”) and short videos help adoption.
