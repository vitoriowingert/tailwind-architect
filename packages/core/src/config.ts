import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnalyzerConfig } from "./types.js";

const DEFAULT_CONFIG: AnalyzerConfig = {
  sortClasses: true,
  removeRedundant: true,
  detectConflicts: true,
  readabilityMode: false,
  autoFix: true,
  classFunctions: ["clsx", "cn", "cva", "tw"],
  plugins: []
};

export const defaultConfig: AnalyzerConfig = { ...DEFAULT_CONFIG };

export async function loadArchitectConfig(cwd: string): Promise<AnalyzerConfig> {
  const filePath = join(cwd, "tailwind-architect.config.json");

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as Partial<AnalyzerConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      classFunctions: parsed.classFunctions?.length
        ? parsed.classFunctions
        : DEFAULT_CONFIG.classFunctions,
      plugins: parsed.plugins ?? DEFAULT_CONFIG.plugins
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
