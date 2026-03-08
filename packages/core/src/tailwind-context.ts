import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";

const CONFIG_FILES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs"
];

export type TailwindContext = {
  projectRoot: string;
  configPath: string;
  configHash: string;
  resolvedConfig: unknown;
};

const contextCache = new Map<string, TailwindContext>();

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findTailwindConfig(startDir: string): Promise<string | null> {
  const { root } = parse(startDir);
  let current = startDir;

  while (true) {
    for (const file of CONFIG_FILES) {
      const candidate = join(current, file);
      if (await exists(candidate)) {
        return candidate;
      }
    }

    if (current === root) {
      return null;
    }
    current = dirname(current);
  }
}

async function hashFile(path: string): Promise<string> {
  const content = await readFile(path, "utf8");
  return createHash("sha1").update(content).digest("hex");
}

export async function loadTailwindContext(startDir: string): Promise<TailwindContext | null> {
  const configPath = await findTailwindConfig(startDir);
  if (!configPath) {
    return null;
  }

  const configHash = await hashFile(configPath);
  const projectRoot = dirname(configPath);
  const cacheKey = `${projectRoot}:${configHash}`;

  const cached = contextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const resolveConfigModuleId: string = "tailwindcss/resolveConfig.js";
    const [{ default: resolveConfig }, configModule] = await Promise.all([
      import(resolveConfigModuleId),
      import(configPath)
    ]);

    const resolvedConfig = resolveConfig(
      (configModule as { default?: unknown }).default ?? configModule
    );

    const ctx: TailwindContext = {
      projectRoot,
      configPath,
      configHash,
      resolvedConfig
    };
    contextCache.set(cacheKey, ctx);
    return ctx;
  } catch {
    return {
      projectRoot,
      configPath,
      configHash,
      resolvedConfig: null
    };
  }
}
