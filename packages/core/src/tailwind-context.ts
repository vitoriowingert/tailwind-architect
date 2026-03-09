import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";

/**
 * Discovers tailwind.config.* (v3/v4). For v4 CSS-only setups (@config in CSS
 * only), no JS config is found; the tool still runs with default prefix/merge.
 * Add a minimal tailwind.config.js that re-exports your theme if you need prefix.
 */
function getConfigFileNames(): string[] {
  return [
    "tailwind.config.ts",
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs"
  ];
}

export type TailwindVersion = "v3" | "v4" | "unknown";

export type TailwindContext = {
  projectRoot: string;
  configPath: string;
  configHash: string;
  resolvedConfig: unknown;
  version: TailwindVersion;
};

let contextCache: Map<string, TailwindContext> = new Map();

function getContextCache(): Map<string, TailwindContext> {
  if (!contextCache || typeof contextCache.get !== "function") {
    contextCache = new Map();
  }
  return contextCache;
}

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
    for (const file of getConfigFileNames()) {
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

async function detectTailwindVersionAsync(projectRoot: string): Promise<TailwindVersion> {
  try {
    const pkgPath = join(projectRoot, "node_modules", "tailwindcss", "package.json");
    const content = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(content) as { version?: string };
    const ver = pkg.version ?? "";
    if (ver.startsWith("4")) return "v4";
    if (ver.startsWith("3")) return "v3";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function resolveWithV3Style(
  _configPath: string,
  configModule: unknown
): Promise<unknown> {
  if (configModule == null) return null;
  const resolveConfigModuleId = "tailwindcss/resolveConfig.js";
  let resolveConfigModule: { default?: (config: unknown) => unknown } | undefined;
  try {
    resolveConfigModule = await import(resolveConfigModuleId) as { default?: (config: unknown) => unknown };
  } catch {
    return null;
  }
  const resolveConfig = resolveConfigModule?.default ?? resolveConfigModule;
  if (typeof resolveConfig !== "function") return null;
  const config = (configModule as { default?: unknown }).default ?? configModule;
  return resolveConfig(config);
}

export async function loadTailwindContext(startDir: string): Promise<TailwindContext | null> {
  const configPath = await findTailwindConfig(startDir);
  if (!configPath) {
    return null;
  }

  const configHash = await hashFile(configPath);
  const projectRoot = dirname(configPath);
  const cacheKey = `${projectRoot}:${configHash}`;

  const cache = getContextCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const version = await detectTailwindVersionAsync(projectRoot);

  try {
    const configModule = await import(configPath);
    if (configModule == null) {
      throw new Error("Config module empty");
    }
    const rawConfig = (configModule as { default?: unknown }).default ?? configModule;
    let resolvedConfig: unknown;

    try {
      resolvedConfig = await resolveWithV3Style(configPath, configModule);
    } catch {
      resolvedConfig = rawConfig;
    }

    const ctx: TailwindContext = {
      projectRoot,
      configPath,
      configHash,
      resolvedConfig: resolvedConfig ?? null,
      version
    };
    getContextCache().set(cacheKey, ctx);
    return ctx;
  } catch {
    const ctx: TailwindContext = {
      projectRoot,
      configPath,
      configHash,
      resolvedConfig: null,
      version
    };
    getContextCache().set(cacheKey, ctx);
    return ctx;
  }
}
