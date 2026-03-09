import { cpus } from "node:os";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { getAdapterForExtension } from "./adapters/index.js";
import { analyzeSourceWithAdapter } from "./analyze-with-adapter.js";
import { analyzeSourceCode, emptyProjectAnalysis } from "./analyze-source.js";
import { findDuplicatePatterns } from "./duplicate-patterns.js";
import { loadPlugins } from "./plugins.js";
import { loadTailwindContext } from "./tailwind-context.js";
import { IGNORE_DIRS, SOURCE_EXTENSIONS } from "@tailwind-architect/shared";
import type { AnalyzerConfig, ProjectAnalysis } from "./types.js";

const DEFAULT_MAX_PER_FILE_ENTRIES = 2000;

function getSourceExtensions(): Set<string> {
  if (SOURCE_EXTENSIONS && typeof SOURCE_EXTENSIONS.has === "function") return SOURCE_EXTENSIONS;
  return new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".astro", ".svelte"]);
}

function getIgnoreDirs(): Set<string> {
  if (IGNORE_DIRS && typeof IGNORE_DIRS.has === "function") return IGNORE_DIRS;
  return new Set(["node_modules", ".git", "dist", "coverage", ".next", ".turbo"]);
}

type AnalyzeProjectOptions = {
  rootDir: string;
  config: AnalyzerConfig;
  mode: "analyze" | "fix" | "lint";
  concurrency?: number;
  maxWorkers?: number;
  dryRun?: boolean;
  maxPerFileEntries?: number;
};

type AnalyzeProjectResult = {
  report: ProjectAnalysis;
  changedFiles: string[];
};

async function collectSourceFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!getIgnoreDirs().has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      if (getSourceExtensions().has(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function runInBatches<T>(
  items: string[],
  concurrency: number,
  worker: (path: string) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  let pointer = 0;

  const runners = new Array(concurrency).fill(0).map(async () => {
    while (pointer < items.length) {
      const current = items[pointer];
      pointer += 1;
      results.push(await worker(current));
    }
  });

  await Promise.all(runners);
  return results;
}

type WorkerResult = {
  filePath: string;
  output: {
    code: string;
    changed: boolean;
    stats: { conflictCount: number; redundancyCount: number; suggestionCount: number };
    classStrings?: string[];
  } | null;
  error?: unknown;
};

type WorkerResultMessage = {
  type: "result";
  workerId: number;
  id: number;
  filePath: string;
  output: WorkerResult["output"];
  error: string | null;
};

type JobMessage = {
  type: "job";
  id: number;
  filePath: string;
  config: AnalyzerConfig;
  mode: "analyze" | "fix" | "lint";
};

async function runWithWorkers(
  files: string[],
  options: AnalyzeProjectOptions
): Promise<WorkerResult[]> {
  const workerDir = dirname(fileURLToPath(import.meta.url));
  const workerPath = pathToFileURL(join(workerDir, "project-worker.js")).href;
  const concurrency = Math.min(
    options.concurrency ?? options.maxWorkers ?? cpus().length,
    files.length
  );
  const results: WorkerResult[] = new Array(files.length);
  let nextIndex = 0;
  let resolvedCount = 0;

  return new Promise((resolve, reject) => {
    const workers: Worker[] = [];

    function sendNext(workerId: number): void {
      if (nextIndex >= files.length) return;
      const id = nextIndex;
      const filePath = files[nextIndex];
      nextIndex += 1;
      workers[workerId].postMessage({
        type: "job",
        id,
        filePath,
        config: options.config,
        mode: options.mode
      } satisfies JobMessage);
    }

    function onMessage(msg: WorkerResultMessage): void {
      results[msg.id] = {
        filePath: msg.filePath,
        output: msg.output,
        error: msg.error ?? undefined
      };
      resolvedCount += 1;
      if (resolvedCount === files.length) {
        workers.forEach((w) => w.terminate());
        resolve(results);
      } else {
        sendNext(msg.workerId);
      }
    }

    try {
      for (let i = 0; i < concurrency; i += 1) {
        const w = new Worker(workerPath, {
          workerData: { workerId: i },
          eval: false
        });
        w.on("message", onMessage);
        w.on("error", reject);
        workers.push(w);
        sendNext(i);
      }
    } catch (err) {
      workers.forEach((w) => w.terminate());
      reject(err);
    }
  });
}

export async function analyzeProject(options: AnalyzeProjectOptions): Promise<AnalyzeProjectResult> {
  const report = emptyProjectAnalysis();
  const changedFiles: string[] = [];
  const concurrency = Math.max(
    1,
    options.concurrency ?? options.maxWorkers ?? cpus().length
  );
  const files = await collectSourceFiles(options.rootDir);
  report.filesScanned = files.length;
  const maxPerFile = options.maxPerFileEntries ?? DEFAULT_MAX_PER_FILE_ENTRIES;
  const dryRun = options.dryRun === true;

  let outcomes: WorkerResult[];

  const inProcessWorker = async (filePath: string): Promise<WorkerResult> => {
    const code = await readFile(filePath, "utf8");
    try {
      const dir = dirname(filePath);
      const tailwindContext = await loadTailwindContext(dir);
      const plugins =
        options.config.plugins?.length ?
          await loadPlugins(dir, options.config.plugins) :
          undefined;
      const adapter = getAdapterForExtension(extname(filePath));
      if (adapter) {
        const spans = await adapter(filePath, code);
        const prefix =
          (tailwindContext?.resolvedConfig as { prefix?: string } | undefined)?.prefix;
        const result = await analyzeSourceWithAdapter(code, options.config, spans, {
          tailwindPrefix: prefix,
          applyFixes: options.mode === "fix" && options.config.autoFix,
          plugins
        });
        return {
          filePath,
          output: { ...result, classStrings: spans.map((s) => s.classString) }
        };
      }
      const output = analyzeSourceCode(code, options.config, {
        applyFixes: options.mode === "fix" && options.config.autoFix,
        tailwindContext,
        plugins,
        filename: filePath
      });
      const classStrings = output.classNodes.map((n) => n.rawString);
      return {
        filePath,
        output: { code: output.code, changed: output.changed, stats: output.stats, classStrings }
      };
    } catch (error) {
      return { filePath, output: null, error };
    }
  };

  if (concurrency > 1 && files.length > 0) {
    try {
      outcomes = await runWithWorkers(files, options);
    } catch {
      outcomes = await runInBatches(files, concurrency, inProcessWorker);
    }
  } else {
    outcomes = await runInBatches(files, concurrency, inProcessWorker);
  }

  for (const outcome of outcomes) {
    if (!outcome.output) {
      report.parseErrorCount += 1;
      report.parseErrors.push({
        filePath: outcome.filePath,
        message: outcome.error instanceof Error ? outcome.error.message : "Unknown parse error"
      });
      continue;
    }

    const { output, filePath } = outcome;
    const hasIssues =
      output.changed ||
      output.stats.conflictCount > 0 ||
      output.stats.redundancyCount > 0 ||
      output.stats.suggestionCount > 0;
    if (hasIssues) {
      report.filesWithIssues += 1;
      if (report.perFile.length < maxPerFile) {
        report.perFile.push({
          filePath,
          conflictCount: output.stats.conflictCount,
          redundancyCount: output.stats.redundancyCount,
          suggestionCount: output.stats.suggestionCount
        });
      }
    }

    report.conflictCount += output.stats.conflictCount;
    report.redundancyCount += output.stats.redundancyCount;
    report.suggestionCount += output.stats.suggestionCount;

    const shouldWrite =
      options.mode === "fix" && options.config.autoFix && output.changed && !dryRun;
    if (shouldWrite) {
      await writeFile(filePath, output.code, "utf8");
      changedFiles.push(filePath);
    }
  }

  const filesData = outcomes
    .filter((o): o is WorkerResult & { output: NonNullable<WorkerResult["output"]> } => !!o.output)
    .map((o) => ({ filePath: o.filePath, classStrings: o.output.classStrings ?? [] }));
  if (filesData.length > 0) {
    report.duplicatePatterns = findDuplicatePatterns(filesData, 2);
  }

  return { report, changedFiles };
}
