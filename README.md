# Tailwind Architect

AST-first tooling for safe Tailwind class analysis and refactoring.

## Packages

- `@tailwind-architect/core`: analysis + transformation engine
- `tailwind-architect`: CLI (`analyze`, `fix`, `lint`)

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
  "classFunctions": ["clsx", "cn", "cva", "tw"]
}
```

## CLI

```bash
tailwind-architect analyze
tailwind-architect fix
tailwind-architect lint
```