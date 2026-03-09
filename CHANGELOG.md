# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [1.0.0] - Initial release

- Core: tokenize, conflicts, redundancy, sort, optimize, analyze-source, project scan
- CLI: `analyze`, `fix`, `lint`
- Config: `tailwind-architect.config.json` with feature flags and class functions
