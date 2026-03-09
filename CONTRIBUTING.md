# Contributing to Tailwind Architect

Thanks for your interest in contributing.

## Development setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/vitorio/tailwind-architect.git
   cd tailwind-architect
   npm install
   ```

2. Build all packages:

   ```bash
   npm run build
   ```

3. Run tests:

   ```bash
   npm run test
   ```

4. Typecheck:

   ```bash
   npm run typecheck
   ```

## Project structure

- **`packages/core`** — Analysis engine (tokenize, conflicts, redundancy, sort, adapters, plugins, duplicate patterns). Depends on `@tailwind-architect/shared`.
- **`packages/shared`** — Shared types and constants (e.g. `ProjectAnalysis`, `SOURCE_EXTENSIONS`).
- **`packages/cli`** — CLI entrypoint; uses `@tailwind-architect/core`.
- **`packages/vscode-extension`** — VSCode/Cursor extension; bundles core.
- **`website/`** — VitePress docs site.
- **`examples/`** — Example plugin and suggested test projects.

## Submitting changes

1. Open an issue or pick an existing one to discuss the change.
2. Fork the repo and create a branch from `main`.
3. Make your changes; keep the test and lint commands passing.
4. Submit a pull request with a clear description and reference to the issue.

## Plugin development

To build a custom plugin, implement the `TailwindArchitectPlugin` contract (see [docs/extensibility.md](docs/extensibility.md) and `examples/example-plugin`). Publish as `tailwind-architect-plugin-*` and add it to `plugins` in `tailwind-architect.config.json`.

## Code style

- TypeScript with strict mode.
- Prefer clear names and small functions; avoid duplication.
- Add or update tests for behavior changes.

## Publishing (maintainers)

Releases are published when a GitHub Release is created (tag, e.g. `v1.0.0`). The workflow [.github/workflows/publish.yml](.github/workflows/publish.yml) runs and:

- **publish-npm**: Publishes `@tailwind-architect/shared`, `@tailwind-architect/core`, and `tailwind-architect` (CLI) to npm.
- **package-extension**: Builds and packages the VS Code extension; optionally publishes to the Marketplace if `VSCE_TOKEN` is set.

**Required secrets (Settings → Secrets and variables → Actions):**

- **NPM_TOKEN**: npm access token with publish rights for the org. If you see `EOTP` (one-time password) errors in CI, the token must be an **Automation** token (classic) or a **Granular** token with **"Bypass two-factor authentication"** enabled—otherwise 2FA blocks unattended publish.
- **VSCE_TOKEN** (optional): VS Code Marketplace personal access token; if missing, extension build and package still run, but publish to the Marketplace is skipped.
