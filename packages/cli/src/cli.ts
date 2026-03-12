#!/usr/bin/env node
import { cwd, exit } from "node:process";
import { stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeProject, loadArchitectConfig } from "@tailwind-architect/core";

type Command = "analyze" | "fix" | "lint";

type CliOptions = {
  command: Command;
  rootDir: string;
  maxWorkers?: number;
  dryRun: boolean;
  reportJson: boolean;
  outputPath?: string;
  detailed: boolean;
};

function parseArgv(argv: string[]): CliOptions {
  const args = argv.slice(2);
  let command: Command = "analyze";
  let rootDir = cwd();
  let maxWorkers: number | undefined;
  let dryRun = false;
  let reportJson = false;
  let outputPath: string | undefined;
  let detailed = false;

  let i = 0;
  if (args[0] === "analyze" || args[0] === "fix" || args[0] === "lint") {
    command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg === "--max-workers" && args[i + 1] !== undefined) {
      maxWorkers = parseInt(args[i + 1], 10);
      i += 2;
    } else if (arg === "--dry-run") {
      dryRun = true;
      i += 1;
    } else if (arg === "--report" && args[i + 1] === "json") {
      reportJson = true;
      i += 2;
    } else if (arg === "--output" && args[i + 1] !== undefined) {
      outputPath = resolve(cwd(), args[i + 1]);
      i += 2;
    } else if (arg === "--detailed") {
      detailed = true;
      i += 1;
    } else if (!arg.startsWith("-")) {
      rootDir = resolve(cwd(), arg);
      i += 1;
    } else {
      i += 1;
    }
  }

  return {
    command,
    rootDir,
    maxWorkers,
    dryRun,
    reportJson,
    outputPath,
    detailed
  };
}

async function ensureRootDirExists(rootDir: string): Promise<void> {
  try {
    const st = await stat(rootDir);
    if (!st.isDirectory()) {
      console.error(`Tailwind Architect: "${rootDir}" is not a directory.`);
      exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) {
      console.error(`Tailwind Architect: directory not found: ${rootDir}`);
    } else {
      console.error(`Tailwind Architect: cannot read "${rootDir}": ${message}`);
    }
    exit(1);
  }
}

async function run(): Promise<void> {
  const {
    command,
    rootDir,
    maxWorkers,
    dryRun,
    reportJson,
    outputPath,
    detailed
  } = parseArgv(process.argv);
  await ensureRootDirExists(rootDir);
  const config = await loadArchitectConfig(rootDir);

  const { report, changedFiles } = await analyzeProject({
    rootDir,
    config,
    mode: command,
    maxWorkers,
    dryRun: command === "fix" ? dryRun : undefined,
    includeDetails: detailed
  });

  const needsPayload = reportJson || outputPath != null;
  if (needsPayload) {
    const payload = {
      command,
      filesScanned: report.filesScanned,
      filesWithIssues: report.filesWithIssues,
      conflictCount: report.conflictCount,
      redundancyCount: report.redundancyCount,
      suggestionCount: report.suggestionCount,
      parseErrorCount: report.parseErrorCount,
      parseErrors: report.parseErrors,
      perFile: report.perFile,
      duplicatePatterns: report.duplicatePatterns ?? [],
      truncated: report.truncated ?? false,
      filesLimit: report.filesLimit ?? null,
      log: report.log ?? [],
      filesScannedPaths: report.filesScannedPaths ?? [],
      perFileDetails: report.perFileDetails ?? [],
      ...(command === "fix" ? { changedFiles } : {})
    };
    const json = JSON.stringify(payload, null, 0);
    if (outputPath != null) {
      await writeFile(outputPath, json, "utf8");
    }
    if (reportJson && outputPath == null) {
      console.log(json);
    }
  } else {
    console.log(`Tailwind Architect :: ${command}`);
    console.log(`Scanned files: ${report.filesScanned}`);
    console.log(`Files with issues: ${report.filesWithIssues}`);
    console.log(`Conflicts: ${report.conflictCount}`);
    console.log(`Redundant utilities: ${report.redundancyCount}`);
    console.log(`Optimization suggestions: ${report.suggestionCount}`);
    console.log(`Duplicate patterns: ${report.duplicatePatterns?.length ?? 0}`);
    console.log(`Parse errors: ${report.parseErrorCount}`);
    if (command === "fix") {
      console.log(`Changed files: ${changedFiles.length}`);
    }
  }

  if (command === "lint") {
    const hasIssues =
      report.conflictCount > 0 ||
      report.redundancyCount > 0 ||
      report.suggestionCount > 0 ||
      (report.duplicatePatterns?.length ?? 0) > 0 ||
      report.parseErrorCount > 0;
    exit(hasIssues ? 1 : 0);
  }
}

run().catch((error: unknown) => {
  console.error("Tailwind Architect failed.");
  console.error(error);
  exit(1);
});
