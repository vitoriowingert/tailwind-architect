# @tailwind-architect/core

Analysis and transformation engine for Tailwind CSS class strings. Powers the [tailwind-architect](https://www.npmjs.com/package/tailwind-architect) CLI and the [VS Code / Cursor extension](https://marketplace.visualstudio.com/). Use this package when you need to analyze or fix Tailwind classes programmatically (e.g. custom tooling, build steps, or integrations).

**Features:** tokenize utilities, detect conflicts and redundancy, sort classes, suggest optimizations (e.g. merge-axis), duplicate-pattern detection, framework adapters (Vue, Astro, Svelte), and a plugin system. Works with Tailwind v3 and v4.

---

## Installation

```bash
npm install @tailwind-architect/core
```

**Peer / runtime:** Expects a Tailwind CSS project (v3 or v4). Dependencies include `tailwindcss`, `@babel/parser`, `@babel/traverse`, `tailwind-merge`, and `@tailwind-architect/shared`.

---

## Quick example

```js
import { analyzeProject, loadArchitectConfig } from "@tailwind-architect/core";

const config = await loadArchitectConfig(process.cwd());
const { report, changedFiles } = await analyzeProject({
  rootDir: "./src",
  config,
  mode: "fix",       // "analyze" | "fix" | "lint"
  dryRun: true
});

console.log(report.filesScanned, report.conflictCount, report.redundancyCount);
```

---

## Main APIs

### Project-level

| Function | Description |
|----------|-------------|
| `analyzeProject(options)` | Scans a directory for supported files, runs analysis (and optionally fix). Returns `{ report: ProjectAnalysis, changedFiles: string[] }`. Options: `rootDir`, `config`, `mode` (`"analyze"` \| `"fix"` \| `"lint"`), `maxWorkers`, `dryRun`. |
| `loadArchitectConfig(cwd)` | Loads `tailwind-architect.config.json` from `cwd`; returns `AnalyzerConfig`. |
| `loadTailwindContext(rootDir)` | Resolves Tailwind config and version from the project; returns `TailwindContext`. |
| `loadPlugins(pluginNames, rootDir)` | Loads Tailwind Architect plugins by name from `rootDir`. |
| `findDuplicatePatterns(sources)` | Finds repeated class sequences across analyzed sources. |

### File / source-level

| Function | Description |
|----------|-------------|
| `analyzeSourceCode(filePath, code, config, tailwindContext?)` | Analyzes a single file’s source; returns analysis results per class string. |
| `analyzeSourceWithAdapter(filePath, code, config, tailwindContext?)` | Same as above but uses the appropriate adapter (Vue, Astro, Svelte, or JS/TS) for the file extension. |
| `extractClassNodesFromSource(filePath, code)` | Extracts class string spans from the file (no Tailwind resolution). |
| `analyzeClassList(classes, config, tailwindContext?)` | Analyzes a list of class strings (e.g. `["flex", "pt-4"]`); returns `AnalysisResult` (sorted, redundant removed, conflicts, suggestions). |
| `getAdapterForExtension(ext)` | Returns the `SourceAdapter` for a file extension (`.vue`, `.astro`, `.svelte`, or default JS/TS). |

### Utilities

| Function | Description |
|----------|-------------|
| `ruleBasedResolver`, `resolveToProperties` | Tailwind utility → CSS properties (for custom tooling or plugins). |

---

## Config

Config is loaded from `tailwind-architect.config.json` via `loadArchitectConfig`. You can also pass a plain object matching `AnalyzerConfig`:

- **Feature flags:** `sortClasses`, `removeRedundant`, `detectConflicts`, `readabilityMode`, `autoFix`
- **classFunctions:** e.g. `["clsx", "cn", "cva", "tw"]` — function names whose arguments are treated as class strings
- **plugins:** optional list of plugin package names

`defaultConfig` is exported for reference.

---

## Types (selected)

- **AnalysisResult** — `original`, `sorted`, `transformed`, `redundantRemoved`, `conflicts`, `suggestions`, `didChange`
- **ClassNode** — location, `rawString`, `classes`, `variantStack`
- **Conflict** — `kind` (override | redundancy | impossible-combination), `property`, `tokens`
- **Suggestion** — `before`, `after`, `kind` (merge-axis | extract-pattern)
- **TailwindArchitectPlugin** — `name`, `lintRules`, `sortGroups`, `suggest`
- **SourceAdapter** — `(filePath, code) => Promise<ClassStringSpan[]>`
- **TailwindContext**, **TailwindVersion** — resolved Tailwind config and version

Full types are exported from the package; use your IDE or `dist/index.d.ts`.

---

## Supported file types

JS/TS/JSX/TSX (including `className` / `class` and class strings inside `classFunctions`), Vue (`.vue`), Astro (`.astro`), Svelte (`.svelte`). Adapters are used automatically by `analyzeSourceWithAdapter` and `analyzeProject`.

---

## Links

- **Repository:** [tailwind-architect](https://github.com/vitoriowingert/tailwind-architect)
- **Docs:** [vitoriowingert.github.io/tailwind-architect](https://vitoriowingert.github.io/tailwind-architect/)
- **CLI:** [tailwind-architect](https://www.npmjs.com/package/tailwind-architect)
- **Shared types:** [@tailwind-architect/shared](https://www.npmjs.com/package/@tailwind-architect/shared)

---

## License

MIT. See the [project license](https://github.com/vitoriowingert/tailwind-architect/blob/main/LICENSE).
