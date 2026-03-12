# tailwind-architect

![Tailwind Architect](logo.png)

**CLI for analyzing and fixing Tailwind CSS classes** — sort utilities, remove redundant classes, detect conflicts, and apply optimizations across your codebase. Uses an AST-first engine that understands Tailwind v3/v4 and supports JSX, Vue, Astro, and Svelte.

Part of the [Tailwind Architect](https://github.com/vitoriowingert/tailwind-architect) toolchain. Use this CLI for CI, scripts, and batch fixes; use the [VS Code / Cursor extension](https://marketplace.visualstudio.com/items?itemName=vitoriowingert.tailwind-architect-vscode) for in-editor diagnostics and quick fixes.

---

## Installation

```bash
npm install tailwind-architect
```

Or with yarn / pnpm:

```bash
yarn add tailwind-architect
pnpm add tailwind-architect
```

**Requirements:** Node.js **≥ 20**, and a project using [Tailwind CSS](https://tailwindcss.com/) (v3 or v4).

---

## Quick start

1. **Install** (see above).

2. **Run from your project root** (where your `package.json` and Tailwind config live):

   ```bash
   npx tailwind-architect analyze
   ```

   This scans supported files and prints a summary: files scanned, conflicts, redundant utilities, suggestions, duplicate patterns, and parse errors.

3. **Fix issues in place:**

   ```bash
   npx tailwind-architect fix
   ```

   Sorts classes, removes redundant utilities, and applies optimization suggestions. Use `--dry-run` to see what would change without writing files.

4. **Use in CI** to fail when issues exist:

   ```bash
   npx tailwind-architect lint
   ```

   Exits with code `1` if there are conflicts, redundancy, suggestions, duplicate patterns, or parse errors; otherwise `0`.

---

## Commands

| Command   | Description                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `analyze` | Scan the project and print a human-readable report (default if no command is given).                                           |
| `fix`     | Apply fixes: sort classes, remove redundant utilities, apply suggestions. Writes changes to disk (use `--dry-run` to preview). |
| `lint`    | Same scan as `analyze`, but exits with code `1` when any issue is found (for CI).                                              |

You can pass a path to scan a specific directory instead of the current working directory:

```bash
npx tailwind-architect fix ./src
npx tailwind-architect lint ./apps/web
```

---

## Options

| Option                  | Description                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[path]`                | Directory to scan. Default: current directory (`.`).                                                                                                      |
| `--max-workers N`       | Maximum number of concurrent file operations. Default: number of CPUs. Tune for large repos.                                                              |
| `--dry-run`             | (**fix** only) Compute and report changes but do **not** write files.                                                                                     |
| `--report json`         | Output a machine-readable JSON report instead of the human-readable summary. Useful for scripts and tooling.                                              |
| `--output &lt;path&gt;` | Write the JSON report to a file. Use with `--report json` or alone; when used alone, still outputs JSON to the file.                                      |
| `--detailed`            | Include per-file details (conflicts, suggestions, redundant classes with locations) in the report. Use with `--report json` or `--output` for a full log. |

### Example: JSON report

```bash
npx tailwind-architect analyze --report json
```

To write the report to a file (with the full list of scanned files and optional per-file details):

```bash
npx tailwind-architect analyze --output report.json
npx tailwind-architect analyze --output report.json --detailed
```

The JSON includes: `command`, `filesScanned`, `filesWithIssues`, `conflictCount`, `redundancyCount`, `suggestionCount`, `parseErrorCount`, `parseErrors`, `perFile`, `duplicatePatterns`, `truncated`, `filesLimit`, `log` (array of `{ level, message }`), `filesScannedPaths` (array of all scanned file paths), `perFileDetails` (when `--detailed` is used: per-file entries with `filePath`, `entries` of `{ location, conflicts, suggestions, redundantRemoved, pluginLints }`), and for `fix`: `changedFiles`.

---

## What the CLI does

- **Sort classes** — Applies a consistent, semantic order to Tailwind utility classes.
- **Remove redundant utilities** — Drops overridden or redundant classes (e.g. later utilities that override earlier ones).
- **Detect conflicts** — Reports conflicting utilities (e.g. same property with different values, impossible combinations).
- **Optimization suggestions** — Suggests merges (e.g. `pt-4` + `pb-4` → `py-4`) and other improvements; **fix** can apply them.
- **Duplicate pattern detection** — Finds repeated class sequences across files that you may want to extract (e.g. into a component or design token).
- **Multi-framework** — Parses `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.astro`, `.svelte`. In JSX/TSX it reads `className` / `class` and class strings inside helpers like `clsx`, `cn`, `cva`, `tw` (configurable).

Conflict detection and suggestions are **variant-scoped**: e.g. `md:pt-4` and `md:pb-4` can be suggested as `md:py-4`; utilities in different variant scopes are not merged incorrectly.

---

## Configuration

Optional: add **`tailwind-architect.config.json`** at your **project root** (same level as `package.json` or `tailwind.config.js`).

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

| Option            | Default                       | Description                                                                              |
| ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `sortClasses`     | `true`                        | Apply semantic sort order to classes.                                                    |
| `removeRedundant` | `true`                        | Remove overridden/redundant utilities.                                                   |
| `detectConflicts` | `true`                        | Report conflicting utilities.                                                            |
| `readabilityMode` | `false`                       | Break long class lists across lines for readability.                                     |
| `autoFix`         | `true`                        | Apply optimization suggestions when running **fix**.                                     |
| `classFunctions`  | `["clsx", "cn", "cva", "tw"]` | Function names whose arguments are treated as class strings (for extraction and fixing). |
| `plugins`         | `[]`                          | Optional list of Tailwind Architect plugin package names.                                |

If the file is missing, the CLI uses the defaults above. Tailwind config is resolved from your project (e.g. `tailwind.config.*`); CSS-only setups (e.g. Tailwind v4 with only `@config` in CSS) work with default behavior.

---

## CI usage

Use **`lint`** in your pipeline to fail when issues are found:

```bash
npx tailwind-architect lint
```

Exit code `1` if there are conflicts, redundancy, suggestions, duplicate patterns, or parse errors; otherwise `0`. You can combine with `--report json` and a custom script if you need to gate on specific metrics.

---

## Programmatic use

The CLI is built on **[@tailwind-architect/core](https://www.npmjs.com/package/@tailwind-architect/core)**. For custom tooling or integrations you can use the core API:

- `analyzeProject` — Full project scan with config and optional workers.
- `analyzeSourceCode` / `analyzeSourceWithAdapter` — Analyze a single file or string.
- `analyzeClassList` — Analyze a list of class strings.
- `loadArchitectConfig` — Load `tailwind-architect.config.json`.
- `loadTailwindContext` — Resolve Tailwind config and version.

See the [core package](https://www.npmjs.com/package/@tailwind-architect/core) and the [repository](https://github.com/vitoriowingert/tailwind-architect) for types and examples.

---

## Links

- **Repository:** [tailwind-architect](https://github.com/vitoriowingert/tailwind-architect)
- **Docs / guide:** [vitoriowingert.github.io/tailwind-architect](https://vitoriowingert.github.io/tailwind-architect/)
- **VS Code / Cursor extension:** [Tailwind Architect](https://marketplace.visualstudio.com/items?itemName=vitoriowingert.tailwind-architect-vscode) — diagnostics, quick fix, “Fix Classes”, “Fix Workspace”, optional format on save
- **Core API (npm):** [@tailwind-architect/core](https://www.npmjs.com/package/@tailwind-architect/core)

---

## License

MIT. See the [project license](https://github.com/vitoriowingert/tailwind-architect/blob/main/LICENSE) in the main repository.
