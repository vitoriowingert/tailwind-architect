# CI usage

## Exit codes

- **`analyze` / `fix`:** Exit code is always `0` (success).
- **`lint`:** Exit code `0` when there are no issues; exit code `1` when there are conflicts, redundant utilities, optimization suggestions, or parse errors.

Use `tailwind-architect lint` in CI to fail the build when the codebase has Tailwind issues.

## JSON report

For scripting or custom reporting, use `--report json`:

```bash
tailwind-architect analyze --report json
tailwind-architect lint --report json
```

Output is a single JSON object with: `command`, `filesScanned`, `filesWithIssues`, `conflictCount`, `redundancyCount`, `suggestionCount`, `parseErrorCount`, `parseErrors`, `perFile`, and (for `fix`) `changedFiles`.

## Example: GitHub Actions

```yaml
- name: Install Tailwind Architect
  run: npm install -g tailwind-architect

- name: Lint Tailwind classes
  run: tailwind-architect lint .
```

Or with npx (no global install):

```yaml
- name: Lint Tailwind classes
  run: npx tailwind-architect lint .
```

To lint a specific app in a monorepo:

```yaml
- name: Lint Tailwind classes (web app)
  run: npx tailwind-architect lint ./apps/web
```

## Dry run

For `fix`, use `--dry-run` to see what would change without writing files:

```bash
tailwind-architect fix . --dry-run
```
