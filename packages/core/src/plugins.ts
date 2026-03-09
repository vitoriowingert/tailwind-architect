import { join } from "node:path";
import type { TailwindArchitectPlugin } from "./types.js";

export async function loadPlugins(
  cwd: string,
  pluginNames: string[]
): Promise<TailwindArchitectPlugin[]> {
  const plugins: TailwindArchitectPlugin[] = [];
  for (const name of pluginNames) {
    try {
      const resolved = join(cwd, "node_modules", name);
      const mod = await import(resolved);
      if (mod == null) continue;
      const plugin = ((mod as { default?: TailwindArchitectPlugin }).default ?? mod) as TailwindArchitectPlugin;
      if (plugin && typeof plugin.name === "string") {
        plugins.push(plugin);
      }
    } catch {
      // Skip invalid or missing plugin
    }
  }
  return plugins;
}
