import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { analyzeSourceCode, emptyProjectAnalysis } from "./analyze-source.js";
import type { AnalyzerConfig, ProjectAnalysis } from "./types.js";

type AnalyzeProjectOptions = {
  rootDir: string;
  config: AnalyzerConfig;
  mode: "analyze" | "fix" | "lint";
  concurrency?: number;
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "coverage", ".next", ".turbo"]);

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
        if (!IGNORE_DIRS.has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
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

export async function analyzeProject(options: AnalyzeProjectOptions): Promise<AnalyzeProjectResult> {
  const report = emptyProjectAnalysis();
  const changedFiles: string[] = [];
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const files = await collectSourceFiles(options.rootDir);
  report.filesScanned = files.length;

  const outcomes = await runInBatches(files, concurrency, async (filePath) => {
    const code = await readFile(filePath, "utf8");
    try {
      const output = analyzeSourceCode(code, options.config);
      return { filePath, output };
    } catch {
      return { filePath, output: null };
    }
  });

  for (const outcome of outcomes) {
    if (!outcome.output) continue;

    const { output, filePath } = outcome;
    const hasIssues =
      output.stats.conflictCount > 0 ||
      output.stats.redundancyCount > 0 ||
      output.stats.suggestionCount > 0;
    if (hasIssues) {
      report.filesWithIssues += 1;
      report.perFile.push({
        filePath,
        conflictCount: output.stats.conflictCount,
        redundancyCount: output.stats.redundancyCount,
        suggestionCount: output.stats.suggestionCount
      });
    }

    report.conflictCount += output.stats.conflictCount;
    report.redundancyCount += output.stats.redundancyCount;
    report.suggestionCount += output.stats.suggestionCount;

    if (options.mode === "fix" && output.changed) {
      await writeFile(filePath, output.code, "utf8");
      changedFiles.push(filePath);
    }
  }

  return { report, changedFiles };
}
