# Vanilla example

Minimal example to run Tailwind Architect (CLI) on a couple of TypeScript files with Tailwind class strings.

## Setup

From this directory (or from the monorepo root with workspace links):

```bash
npm install
```

## Run

```bash
# Analyze (report only)
npx tailwind-architect analyze .

# Fix (sort, remove redundant, apply suggestions)
npx tailwind-architect fix .

# Lint (exit 1 if issues)
npx tailwind-architect lint .
```

Optional: add `tailwind-architect.config.json` here to tune behavior. A `tailwind.config.js` (or dependency on `tailwindcss`) helps the tool resolve prefix/theme when present.
