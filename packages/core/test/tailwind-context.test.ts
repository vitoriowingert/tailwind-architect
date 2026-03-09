import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTailwindContext } from "../src/tailwind-context.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("loadTailwindContext", () => {
  it("returns null when no tailwind config exists", async () => {
    const result = await loadTailwindContext(__dirname);
    expect(result).toBeNull();
  });

  it("returns context with resolvedConfig when config exists and resolveConfig is available", async () => {
    const fixtureDir = join(__dirname, "fixtures", "with-config");
    const result = await loadTailwindContext(fixtureDir);
    expect(result).not.toBeNull();
    expect(result?.projectRoot).toBe(fixtureDir);
    expect(result?.configPath).toContain("tailwind.config");
    expect(result?.configHash).toBeDefined();
    expect(result?.version).toBeDefined();
    if (result?.resolvedConfig && typeof result.resolvedConfig === "object") {
      const config = result.resolvedConfig as { prefix?: string };
      expect(config.prefix === undefined || config.prefix === "tw-").toBe(true);
    }
  });

  it("returns same cached context for same directory on second call", async () => {
    const fixtureDir = join(__dirname, "fixtures", "with-config");
    const first = await loadTailwindContext(fixtureDir);
    const second = await loadTailwindContext(fixtureDir);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.configHash).toBe(second?.configHash);
  });
});
