# Tailwind Architect (VSCode / Cursor Extension)

Analyze and fix Tailwind CSS classes directly in your editor: sort utilities, remove redundancy, detect conflicts, and apply optimization suggestions.

Part of the [Tailwind Architect](https://github.com/vitoriowingert/tailwind-architect) toolchain. Use this extension in VS Code or Cursor; use the [CLI](https://www.npmjs.com/package/tailwind-architect) for CI and batch fixes.

---

## Features

- **Diagnostics** — See a summary of issues per file (conflicts, redundant utilities, suggestions). Optional **span-level** diagnostics (one per class string) for large files.
- **Quick fix** — Code action **"Tailwind Architect: Fix Classes"** to fix the current file.
- **Fix current file** — Command **"Tailwind Architect: Fix Classes"** (Command Palette) to sort, remove redundant classes, and apply suggestions in the active document.
- **Fix workspace** — Command **"Tailwind Architect: Fix Workspace"** to run the fix across all supported files in the workspace (with progress).
- **Format on save** — Optional; enable in settings to run the fix automatically when you save supported files.
- **Multi-framework** — Supports JavaScript, TypeScript, JSX, TSX, Vue (`.vue`), Astro (`.astro`), and Svelte (`.svelte`).

---

## Installation

### From the Marketplace

1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for **Tailwind Architect**.
3. Click **Install**.

Works in **VS Code** and **Cursor**.

### From a VSIX file (local build)

1. Build the extension (from the repo root):
   ```bash
   npm run build --workspace tailwind-architect-vscode
   cd packages/vscode-extension && npm run package
   ```
2. In VS Code/Cursor: **Extensions** → **...** (top right) → **Install from VSIX**.
3. Select the generated `tailwind-architect-vscode-*.vsix` file.

---

## Requirements

- A project that uses [Tailwind CSS](https://tailwindcss.com/) (v3 or v4).
- Optional: a `tailwind-architect.config.json` at your **workspace root** to tune behavior (see [Configuration](#configuration)).

The extension uses your workspace root to resolve config and Tailwind. A single-root folder is recommended.

---

## Usage

### Commands (Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`)

| Command | Description |
|--------|-------------|
| **Tailwind Architect: Fix Classes** | Fix the currently active file (sort, remove redundant, apply suggestions). |
| **Tailwind Architect: Fix Workspace** | Fix all supported files in the workspace. Shows progress and a summary. |

### Code actions (Quick fix)

In supported files, when the extension reports issues, use the lightbulb or **Quick Fix** (`Ctrl+.` / `Cmd+.`) and choose **Tailwind Architect: Fix Classes**.

### Settings

Open **Settings** (`Ctrl+,` / `Cmd+,`) and search for **Tailwind Architect**.

| Setting | Type | Default | Description |
|--------|------|--------|-------------|
| **Tailwind Architect: Format On Save** | `boolean` | `false` | Run the fix when you save a supported file. |
| **Tailwind Architect: Diagnostics At Span Level** | `boolean` | `false` | Show one diagnostic per class string (with range) instead of one per file. Useful for large files. |

---

## Supported languages and files

- **JavaScript / TypeScript** — `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
- **Vue** — `.vue` (template `class` attributes)
- **Astro** — `.astro`
- **Svelte** — `.svelte`

Class strings are read from:

- JSX/TSX: `className`, `class`, and inside helpers like `clsx`, `cn`, `cva`, `tw` (configurable in `tailwind-architect.config.json`).
- Vue/Astro/Svelte: `class="..."` (and `class='...'`) in templates.

---

## Configuration

Optional: add **`tailwind-architect.config.json`** at your **workspace root** (same level as `package.json` or `tailwind.config.js`).

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

- **sortClasses** — Apply semantic sort order.
- **removeRedundant** — Remove overridden/redundant utilities.
- **detectConflicts** — Report conflicting utilities.
- **readabilityMode** — Break long class lists across lines.
- **classFunctions** — Function names whose arguments are treated as class strings.
- **plugins** — Optional list of Tailwind Architect plugin package names.

If the file is missing, the extension uses the defaults above.

---

## Compatibility

- **Tailwind v3 and v4** — The extension uses the same engine as the CLI; it discovers `tailwind.config.*` and respects your prefix/theme when available. CSS-only setups (e.g. v4 with only `@config` in CSS) still work with default behavior.
- **VS Code** — `^1.74.0`.
- **Cursor** — Compatible with the same API.

---

## Troubleshooting

- **No diagnostics or fix doesn’t run**  
  Ensure the current file’s language or extension is supported, and that the folder you opened is the workspace root (or contains your `tailwind-architect.config.json` and Tailwind setup).

- **“No workspace folder open”**  
  Open a folder (File → Open Folder) so the extension can resolve the root and config.

- **Fix Workspace is slow**  
  The extension runs the same logic as the CLI over many files. For very large workspaces, consider using the CLI with `--max-workers` in a terminal instead.

- **Wrong or missing Tailwind prefix**  
  Ensure `tailwind.config.*` is present and that the extension can load it (e.g. no runtime errors in the config). The extension resolves config from the workspace root.

---

## Links

- **Repository:** [tailwind-architect](https://github.com/vitoriowingert/tailwind-architect)
- **CLI (npm):** [tailwind-architect](https://www.npmjs.com/package/tailwind-architect)
- **Docs:** [Guide](https://vitoriowingert.github.io/tailwind-architect/) (or `website/` in the repo)
- **Core API:** [@tailwind-architect/core](https://www.npmjs.com/package/@tailwind-architect/core)

---

## License

MIT. See the [project license](https://github.com/vitoriowingert/tailwind-architect/blob/main/LICENSE) in the main repository.
