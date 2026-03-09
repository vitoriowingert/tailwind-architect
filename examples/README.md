# Examples

Use these as reference for running Tailwind Architect in real projects.

## Running the CLI

From this repo (after `npm run build` from the root):

```bash
# Analyze current directory
node packages/cli/dist/cli.js analyze .

# Analyze a specific path (e.g. your app)
node packages/cli/dist/cli.js analyze ./path/to/app

# Fix with dry run (no writes)
node packages/cli/dist/cli.js fix . --dry-run

# Lint (exit 1 if issues)
node packages/cli/dist/cli.js lint .
```

If you install the CLI globally or use npx:

```bash
npx tailwind-architect analyze .
npx tailwind-architect fix . --dry-run
npx tailwind-architect lint .
```

## Suggested test projects

- A **Next.js** app with Tailwind and `className` / `clsx` / `cn` usage.
- A **Tailwind v4** project (CSS-first or with `tailwind.config.*`).
- A repo using **shadcn/ui** or **CVA** for class composition.

Place a `tailwind-architect.config.json` at the project root to tune behavior (see root [README](../README.md)).
