# @tailwind-architect/shared

Shared types and constants for the [Tailwind Architect](https://github.com/vitoriowingert/tailwind-architect) toolchain. Used by `@tailwind-architect/core` and the `tailwind-architect` CLI.

**Most users should use the [CLI](https://www.npmjs.com/package/tailwind-architect) or [core](https://www.npmjs.com/package/@tailwind-architect/core)** for analysis and fixes. This package is intended for consumers that need the shared type definitions and constants without pulling in the full core engine.

---

## Installation

```bash
npm install @tailwind-architect/shared
```

---

## Exports

### Constants

| Export | Description |
|--------|-------------|
| `SOURCE_EXTENSIONS` | `Set<string>` — File extensions scanned for Tailwind classes (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.vue`, `.astro`, `.svelte`). |
| `IGNORE_DIRS` | `Set<string>` — Directory names excluded from project scans (`node_modules`, `.git`, `dist`, `coverage`, `.next`, `.turbo`). |

### Types

| Type | Description |
|------|-------------|
| `AnalyzerConfig` | Full config (feature flags + `classFunctions`, `plugins`). |
| `FeatureFlags` | `sortClasses`, `removeRedundant`, `detectConflicts`, `readabilityMode`, `autoFix`. |
| `ProjectAnalysis` | Result of a project-wide scan: `filesScanned`, `filesWithIssues`, counts, `perFile`, `parseErrors`, `duplicatePatterns`. |
| `FileIssue` | Per-file summary: `filePath`, `conflictCount`, `redundancyCount`, `suggestionCount`. |
| `FileParseError` | Parse error: `filePath`, `message`. |
| `DuplicatePattern` | Repeated class sequence: `pattern`, `occurrences`, `filePaths`. |

---

## Links

- **Repository:** [tailwind-architect](https://github.com/vitoriowingert/tailwind-architect)
- **CLI:** [tailwind-architect](https://www.npmjs.com/package/tailwind-architect)
- **Core (engine):** [@tailwind-architect/core](https://www.npmjs.com/package/@tailwind-architect/core)

---

## License

MIT. See the [project license](https://github.com/vitoriowingert/tailwind-architect/blob/main/LICENSE).
