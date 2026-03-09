/**
 * Integration test that mirrors the extension flow:
 * loadArchitectConfig → loadTailwindContext → analyzeSourceCode / getAdapterForExtension.
 * Catches runtime errors (e.g. undefined .get) that can occur in the bundled extension.
 */
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadArchitectConfig,
  loadTailwindContext,
  analyzeSourceCode,
  getAdapterForExtension,
  analyzeSourceWithAdapter,
  extractClassNodesFromSource
} from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixtureDir = join(__dirname, "fixtures", "with-config");

describe("extension flow integration", () => {
  it("loadArchitectConfig returns config object with expected keys", async () => {
    const config = await loadArchitectConfig(fixtureDir);
    expect(config).toBeDefined();
    expect(config.sortClasses).toBeDefined();
    expect(config.removeRedundant).toBeDefined();
    expect(config.detectConflicts).toBeDefined();
    expect(Array.isArray(config.classFunctions)).toBe(true);
  });

  it("loadTailwindContext returns context or null without throwing", async () => {
    const ctx = await loadTailwindContext(fixtureDir);
    expect(ctx === null || (typeof ctx === "object" && "projectRoot" in ctx)).toBe(true);
    if (ctx) {
      expect(typeof ctx.configPath).toBe("string");
      expect(typeof ctx.configHash).toBe("string");
    }
  });

  it("analyzeSourceCode on real component content does not throw", async () => {
    const config = await loadArchitectConfig(fixtureDir);
    const tailwindContext = await loadTailwindContext(fixtureDir);
    const buttonPath = join(fixtureDir, "Button.tsx");
    const code = await readFile(buttonPath, "utf8");
    const output = analyzeSourceCode(code, config, {
      applyFixes: false,
      tailwindContext
    });
    expect(output).toBeDefined();
    expect(typeof output.code).toBe("string");
    expect(typeof output.changed).toBe("boolean");
    expect(output.stats).toBeDefined();
    expect(typeof output.stats.conflictCount).toBe("number");
    expect(typeof output.stats.redundancyCount).toBe("number");
    expect(typeof output.stats.suggestionCount).toBe("number");
  });

  it("getAdapterForExtension returns adapter or null", () => {
    expect(getAdapterForExtension(".vue")).toBeDefined();
    expect(getAdapterForExtension(".astro")).toBeDefined();
    expect(getAdapterForExtension(".svelte")).toBeDefined();
    expect(getAdapterForExtension(".tsx")).toBeNull();
  });

  it("extractClassNodesFromSource does not throw", async () => {
    const config = await loadArchitectConfig(fixtureDir);
    const tailwindContext = await loadTailwindContext(fixtureDir);
    const code = await readFile(join(fixtureDir, "Button.tsx"), "utf8");
    const nodes = extractClassNodesFromSource(code, config, { tailwindContext });
    expect(Array.isArray(nodes)).toBe(true);
  });

  it("analyzeSourceWithAdapter on Vue-style spans does not throw", async () => {
    const config = await loadArchitectConfig(fixtureDir);
    const spans = [
      { start: 0, end: 20, classString: "flex items-center gap-2 p-4 pt-4" }
    ];
    const result = await analyzeSourceWithAdapter("dummy", config, spans, {
      tailwindPrefix: undefined,
      applyFixes: false
    });
    expect(result).toBeDefined();
    expect(result.stats).toBeDefined();
  });
});
