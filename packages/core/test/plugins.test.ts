import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { loadPlugins } from "../src/plugins.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const withConfigDir = join(__dirname, "fixtures", "with-config");

/** Temp dir with a real plugin so tests pass in CI (no committed node_modules). */
let tempFixtureDir: string;

beforeAll(async () => {
  tempFixtureDir = join(
    tmpdir(),
    `tailwind-architect-plugin-test-${Date.now()}`
  );
  const pluginDir = join(
    tempFixtureDir,
    "node_modules",
    "tailwind-architect-plugin-test"
  );
  await mkdir(pluginDir, { recursive: true });
  await writeFile(
    join(pluginDir, "package.json"),
    JSON.stringify({
      name: "tailwind-architect-plugin-test",
      version: "1.0.0",
      type: "module",
      main: "index.js"
    })
  );
  await writeFile(
    join(pluginDir, "index.js"),
    'export default { name: "tailwind-architect-plugin-test" };'
  );
});

afterAll(async () => {
  try {
    await rm(tempFixtureDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe("loadPlugins", () => {
  it("loads a valid plugin from node_modules", async () => {
    const plugins = await loadPlugins(tempFixtureDir, [
      "tailwind-architect-plugin-test"
    ]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("tailwind-architect-plugin-test");
  });

  it("returns empty array for non-existent plugin without throwing", async () => {
    const plugins = await loadPlugins(tempFixtureDir, ["non-existent-plugin"]);
    expect(plugins).toEqual([]);
  });

  it("rejects plugin name with path traversal and does not load from outside node_modules", async () => {
    const plugins = await loadPlugins(tempFixtureDir, [
      "../../../package.json"
    ]);
    expect(plugins).toHaveLength(0);
  });

  it("rejects plugin name containing ..", async () => {
    const plugins = await loadPlugins(tempFixtureDir, [
      "..",
      "foo/../bar",
      "tailwind-architect-plugin-test"
    ]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("tailwind-architect-plugin-test");
  });

  it("rejects empty or invalid plugin names", async () => {
    expect(await loadPlugins(withConfigDir, [""])).toHaveLength(0);
    expect(await loadPlugins(withConfigDir, ["foo\x00bar"])).toHaveLength(0);
  });

  it("returns multiple valid plugins and skips invalid ones", async () => {
    const plugins = await loadPlugins(tempFixtureDir, [
      "tailwind-architect-plugin-test",
      "non-existent",
      "tailwind-architect-plugin-test"
    ]);
    expect(plugins).toHaveLength(2);
    expect(
      plugins.every((p) => p.name === "tailwind-architect-plugin-test")
    ).toBe(true);
  });
});
