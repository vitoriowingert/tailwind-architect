# Extensibility and future Tailwind versions

## Tailwind context interface

The core expects a **Tailwind context** with at least:

- **Location:** `projectRoot`, `configPath`, `configHash` (for caching).
- **Resolved config:** `resolvedConfig` (optional). Used to read `prefix` and, in the future, theme/plugin data. When resolution fails (e.g. no Tailwind, or CSS-only v4 config), it can be `null`; the tool still runs with defaults.
- **Version:** `version` (`"v3" | "v4" | "unknown"`) for optional version-specific behavior.

Implementations:

- **v3:** Discover `tailwind.config.*`, load with Node, call `tailwindcss/resolveConfig`. Prefix and theme come from `resolvedConfig`.
- **v4:** Same discovery; `resolveConfig` may still work; otherwise use raw config. When v4 moves to CSS-first only, a separate adapter can read `@config` or theme from CSS and expose a minimal context.

For a future Tailwind major (e.g. v5), add a new implementation that returns this shape without changing the rest of the pipeline.

## Plugin system

Plugins are configured in `tailwind-architect.config.json`:

```json
{
  "plugins": ["tailwind-architect-plugin-my-rules"]
}
```

Each plugin is a package (or path) that exports a **TailwindArchitectPlugin**:

- **name** (string): Plugin identifier.
- **lintRules** (optional): Array of functions `(context: PluginLintContext) => PluginLintResult[]`. Each rule receives `{ classList, variantStack }` and returns diagnostic messages. Results are merged and counted as suggestions in the report.
- **sortGroups** (optional): Array of `{ name, test: (utility) => boolean, order?: number }`. Merged with built-in groups; utilities matching a group's `test` are ordered with that group (default order: after built-in groups).
- **suggest** (optional): `(context: { classList, variantStack }) => Suggestion[]`. Extra suggestions (e.g. design-system hints) merged with built-in suggestions.

**PluginLintContext:** `{ classList: string[]; variantStack: string[] }`  
**PluginLintResult:** `{ message: string }`  
**Suggestion:** `{ before: [string, string]; after: string; kind: string }` (use `kind: "merge-axis"` or a custom kind).

The core loads plugins from the project's `node_modules`. Publish plugins as `tailwind-architect-plugin-*` packages and list them in `plugins` to enable. See `examples/example-plugin` for a minimal plugin.

## Design system enforcement (design)

Plugins or config could later support:

- **Prefer / avoid:** Prefer `rounded-lg` over `rounded-md` or disallow arbitrary spacing values.
- **Custom conflict rules:** e.g. In our design system, X and Y are mutually exclusive.
- **Component or utility extraction hints:** e.g. This pattern appears N times; suggest extracting a component or a custom utility.

These can be implemented as plugin-provided rules (lintRules / suggest) today.
