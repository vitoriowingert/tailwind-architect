# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.8] - 2025-03-09

### Changed

- **Docs:** README, website (io), and CONTRIBUTING aligned with current features (config, CLI JSON report, publishing, extension settings).
- **Links:** Direct VS Code Marketplace link for the extension; CI and extensibility references verified.

## [1.0.7] - 2025-03-09

### Added

- **Worker-based processing:** Optional Node.js worker threads for parallel file processing when `--max-workers` > 1; context cache per worker
- **Shared package:** `@tailwind-architect/shared` for types and constants (SOURCE_EXTENSIONS, IGNORE_DIRS, ProjectAnalysis, etc.)
- **Framework adapters:** Vue, Astro, Svelte adapters; SourceAdapter contract; project and extension support for .vue, .astro, .svelte
- **Plugin system:** TailwindArchitectPlugin (lintRules, sortGroups, suggest); config `plugins: string[]`; pipeline hooks; example plugin in examples/example-plugin
- **Duplicate pattern detection:** findDuplicatePatterns(); report.duplicatePatterns; CLI output and --report json; suggestion kind extract-pattern
- **Extension:** "Fix Workspace" command; optional span-level diagnostics (tailwindArchitect.diagnosticsAtSpanLevel); extension publish in CI (package-extension job, VSCE_TOKEN)
- **Docs site:** VitePress website (website/) with guide, CLI, configuration, extension, compatibility, troubleshooting
- **Examples:** examples/vanilla runnable example; examples/example-plugin; CONTRIBUTING.md and README badges
- Tailwind v3/v4 config resolution with version detection and fallback
- `UtilityResolver` interface and `ruleBasedResolver` for conflict/redundancy extension
- Variant-scoped conflict detection and merge-axis suggestions
- `--max-workers`, `--dry-run`, and optional path argument for CLI
- Bounded per-file report entries and performance doc
- **Security:** Plugin path validation to prevent path traversal; only load plugins from under `node_modules`
- **CLI:** Validate `rootDir` exists and is a directory before running; clear stderr message and exit 1 on failure
- **Config:** Schema validation (Zod) for `tailwind-architect.config.json`; invalid or malformed config falls back to defaults
- **Repo:** ESLint and Prettier; CI runs lint and format:check
- **Extension:** `fixWorkspaceMaxFiles` setting; in-memory config cache with invalidation on save of `tailwind-architect.config.json`
- **Report:** Optional `log` array (info/warn entries) in analyze result and `--report json`; `truncated` and `filesLimit` in JSON output when maxFiles is used
- **Publish:** Test and lint steps in release workflow before publishing to npm and packaging the extension

## [1.0.0] - Initial release

- Core: tokenize, conflicts, redundancy, sort, optimize, analyze-source, project scan
- CLI: `analyze`, `fix`, `lint`
- Config: `tailwind-architect.config.json` with feature flags and class functions
