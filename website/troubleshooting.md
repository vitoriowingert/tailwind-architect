# Troubleshooting

## No Tailwind config found

The tool looks for `tailwind.config.*` starting from the directory of each file and walking up. If you use a CSS-only setup (e.g. Tailwind v4 with `@config` in CSS), the tool still runs with default prefix and merge behavior. To get prefix from your theme, add a minimal `tailwind.config.js` that re-exports your config.

## Parse errors

If you see parse errors in the report, the file may use syntax the parser doesn’t support (e.g. very recent JS/TS features or non-standard extensions). Ensure the file is valid and that the project’s Babel/TypeScript config is compatible. Vue/Astro/Svelte adapters use regex-based extraction; complex dynamic class bindings may be missed.

## Worker / memory issues

For very large repos, reduce concurrency: `--max-workers 2`. See [Performance](https://github.com/vitorio/tailwind-architect/blob/main/docs/performance.md).

## Extension not activating

Ensure the file’s language ID or extension is supported (e.g. `.vue`, `.astro`, `.svelte`). Open a supported file or run a command from the Command Palette to activate the extension.
