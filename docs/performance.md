# Performance

## Concurrency and scale

- **Worker-based processing:** When `--max-workers` is greater than 1, the core uses Node.js worker threads to process files in parallel. Each worker has its own Tailwind context cache (`projectRoot:configHash`), so config is resolved once per worker. For single-worker runs, processing stays in the main process.
- **Concurrency:** The CLI and core use a configurable number of parallel file operations (`--max-workers`, default: CPU count). I/O and parsing are concurrent across files (via workers or in-process batching).
- **Bounded reporting:** For very large repositories, the number of per-file issue entries in the report is capped (default: 2000) to limit memory. Aggregate counts (e.g. total conflicts) are still exact.
- **Tailwind context cache:** Resolved Tailwind config is cached per `projectRoot:configHash` (per process or per worker), so the same config is not re-resolved for every file.

## Benchmarking

Run the CLI and measure wall time:

```bash
time npx tailwind-architect analyze .
```

Or with a specific worker count:

```bash
time npx tailwind-architect analyze . --max-workers 4
```

## Expected limits

- **10k+ files:** The tool is designed to handle large monorepos. Use `--max-workers` to tune (e.g. set to CPU count or slightly lower for heavy repos; reduce if memory is tight).
- **Dry run:** Use `tailwind-architect fix --dry-run` to see what would change without writing files.
