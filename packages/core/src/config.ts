import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnalyzerConfig } from "./types.js";

export const defaultConfig: AnalyzerConfig = {
  sortClasses: true,
  removeRedundant: true,
  detectConflicts: true,
  readabilityMode: false,
  autoFix: true,
  classFunctions: ["clsx", "cn", "cva", "tw"]
};

export async function loadArchitectConfig(cwd: string): Promise<AnalyzerConfig> {
  const filePath = join(cwd, "tailwind-architect.config.json");

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as Partial<AnalyzerConfig>;
    return {
      ...defaultConfig,
      ...parsed,
      classFunctions: parsed.classFunctions?.length
        ? parsed.classFunctions
        : defaultConfig.classFunctions
    };
  } catch {
    return defaultConfig;
  }
}
