# Configuration

Create `tailwind-architect.config.json` at your project root.

## Options

| Option             | Type     | Default  | Description |
| ------------------ | -------- | -------- | ----------- |
| `sortClasses`      | boolean  | `true`   | Apply semantic sort order. |
| `removeRedundant`  | boolean  | `true`   | Remove overridden/redundant utilities. |
| `detectConflicts`  | boolean  | `true`   | Detect conflicting utilities. |
| `readabilityMode`  | boolean  | `false`  | Format long class lists with line breaks. |
| `autoFix`          | boolean  | `true`   | Allow the `fix` command to write files. |
| `classFunctions`   | string[] | see below | Function names whose arguments are class strings (e.g. `clsx`, `cn`). |
| `plugins`          | string[] | `[]`     | Plugin package names (e.g. `tailwind-architect-plugin-my-rules`). |

Default `classFunctions`: `["clsx", "cn", "cva", "tw"]`.

## Example

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

## Plugins

Plugins add custom lint rules, sort groups, and suggestions. See [Extensibility](https://github.com/vitoriowingert/tailwind-architect/blob/main/docs/extensibility.md#plugin-system) and `examples/example-plugin` in the repo.
