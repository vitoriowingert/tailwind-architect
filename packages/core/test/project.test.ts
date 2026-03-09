import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeProject } from "../src/project.js";
import { defaultConfig } from "../src/config.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("analyzeProject", () => {
  const fixtureDir = join(__dirname, "fixtures", "with-config");

  it("reports same counts with maxWorkers 1 and 2 when workers are used", async () => {
    const result1 = await analyzeProject({
      rootDir: fixtureDir,
      config: defaultConfig,
      mode: "analyze",
      maxWorkers: 1
    });
    const result2 = await analyzeProject({
      rootDir: fixtureDir,
      config: defaultConfig,
      mode: "analyze",
      maxWorkers: 2
    });
    expect(result2.report.filesScanned).toBe(result1.report.filesScanned);
    expect(result2.report.conflictCount).toBe(result1.report.conflictCount);
    expect(result2.report.redundancyCount).toBe(result1.report.redundancyCount);
    expect(result2.report.suggestionCount).toBe(result1.report.suggestionCount);
  });
});
