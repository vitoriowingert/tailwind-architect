# VSCode / Cursor extension

Install **Tailwind Architect** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vitoriowingert.tailwind-architect-vscode) (or install from the built `.vsix` in the repo).

## Features

- **Diagnostics** — File-level (or optional span-level) summary of conflicts, redundancy, and suggestions.
- **Quick fix** — “Tailwind Architect: Fix Classes” in the code action menu.
- **Command: Fix Classes** — Fix the current file (Command Palette: “Tailwind Architect: Fix Classes”).
- **Command: Fix Workspace** — Fix all supported files in the workspace (with progress).
- **Format on save** — Optional; enable in settings: `tailwindArchitect.formatOnSave`.
- **Span-level diagnostics** — Optional; enable `tailwindArchitect.diagnosticsAtSpanLevel` to show one diagnostic per class string span.

## Supported languages

- JavaScript, TypeScript, JSX, TSX
- Vue, Astro, Svelte (by file extension)

## Settings

| Setting                                    | Type    | Default | Description                                                      |
| ------------------------------------------ | ------- | ------- | ---------------------------------------------------------------- |
| `tailwindArchitect.formatOnSave`           | boolean | `false` | Run fix on save for supported files.                             |
| `tailwindArchitect.diagnosticsAtSpanLevel` | boolean | `false` | One diagnostic per class span instead of per file.               |
| `tailwindArchitect.fixWorkspaceMaxFiles`   | number  | `5000`  | Max files to process when running Fix Workspace; `0` = no limit. |

Config is cached in memory and invalidated when you save `tailwind-architect.config.json`.
