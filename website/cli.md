# CLI reference

## Commands

| Command   | Description                                      |
| --------- | ------------------------------------------------- |
| `analyze` | Scan files and report conflicts, redundancy, suggestions, duplicate patterns |
| `fix`     | Apply fixes (sort, remove redundant, apply suggestions) and write files |
| `lint`    | Same as analyze; exits with code 1 if there are issues (for CI) |

## Usage

```bash
tailwind-architect <command> [path]
```

- **`[path]`** — Directory to scan (default: current directory).

## Options

- **`--max-workers N`** — Max concurrent file operations (default: CPU count). Use a lower value if you hit memory limits.
- **`--dry-run`** — For `fix`: compute and report changes but do not write files.
- **`--report json`** — Output machine-readable JSON (includes `filesScanned`, `conflictCount`, `redundancyCount`, `suggestionCount`, `duplicatePatterns`, `perFile`, `parseErrors`, and for `fix` the list of `changedFiles`).

## Exit codes

- **`lint`** — Exits with `1` when there are conflicts, redundancy, suggestions, duplicate patterns, or parse errors; otherwise `0`. Use in CI to fail the build.

## Examples

```bash
# Analyze current directory
npx tailwind-architect analyze .

# Fix with dry run
npx tailwind-architect fix . --dry-run

# Lint and get JSON report
npx tailwind-architect lint . --report json
```
