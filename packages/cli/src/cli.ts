#!/usr/bin/env node
import { cwd, exit } from "node:process";
import { analyzeProject, loadArchitectConfig } from "@tailwind-architect/core";

type Command = "analyze" | "fix" | "lint";

function parseCommand(argv: string[]): Command {
  const command = argv[2];
  if (command === "analyze" || command === "fix" || command === "lint") {
    return command;
  }
  return "analyze";
}

async function run(): Promise<void> {
  const command = parseCommand(process.argv);
  const rootDir = cwd();
  const config = await loadArchitectConfig(rootDir);

  const { report, changedFiles } = await analyzeProject({
    rootDir,
    config,
    mode: command
  });

  console.log(`Tailwind Architect :: ${command}`);
  console.log(`Scanned files: ${report.filesScanned}`);
  console.log(`Files with issues: ${report.filesWithIssues}`);
  console.log(`Conflicts: ${report.conflictCount}`);
  console.log(`Redundant utilities: ${report.redundancyCount}`);
  console.log(`Optimization suggestions: ${report.suggestionCount}`);
  if (command === "fix") {
    console.log(`Changed files: ${changedFiles.length}`);
  }

  if (command === "lint") {
    const hasIssues =
      report.conflictCount > 0 || report.redundancyCount > 0 || report.suggestionCount > 0;
    exit(hasIssues ? 1 : 0);
  }
}

run().catch((error: unknown) => {
  console.error("Tailwind Architect failed.");
  console.error(error);
  exit(1);
});
