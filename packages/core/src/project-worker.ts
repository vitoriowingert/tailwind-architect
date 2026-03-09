import { parentPort, workerData } from "node:worker_threads";
import { readFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { getAdapterForExtension } from "./adapters/index.js";
import { analyzeSourceWithAdapter } from "./analyze-with-adapter.js";
import { analyzeSourceCode } from "./analyze-source.js";
import { loadPlugins } from "./plugins.js";
import { loadTailwindContext } from "./tailwind-context.js";
import type { AnalyzerConfig } from "./types.js";

type JobMessage = {
  type: "job";
  id: number;
  filePath: string;
  config: AnalyzerConfig;
  mode: "analyze" | "fix" | "lint";
};

type ResultMessage = {
  type: "result";
  workerId: number;
  id: number;
  filePath: string;
  output: {
    code: string;
    changed: boolean;
    stats: { conflictCount: number; redundancyCount: number; suggestionCount: number };
    classStrings?: string[];
  } | null;
  error: string | null;
};

async function processOne(
  filePath: string,
  config: AnalyzerConfig,
  mode: "analyze" | "fix" | "lint"
): Promise<ResultMessage["output"]> {
  const code = await readFile(filePath, "utf8");
  const dir = dirname(filePath);
  const tailwindContext = await loadTailwindContext(dir);
  const plugins = config.plugins?.length ? await loadPlugins(dir, config.plugins) : undefined;
  const applyFixes = mode === "fix" && config.autoFix;
  const adapter = getAdapterForExtension(extname(filePath));
  if (adapter) {
    const spans = await adapter(filePath, code);
    const prefix =
      (tailwindContext?.resolvedConfig as { prefix?: string } | undefined)?.prefix;
    const result = await analyzeSourceWithAdapter(code, config, spans, {
      tailwindPrefix: prefix,
      applyFixes,
      plugins
    });
    return { ...result, classStrings: spans.map((s) => s.classString) };
  }
  const output = analyzeSourceCode(code, config, {
    applyFixes,
    tailwindContext,
    plugins,
    filename: filePath
  });
  return {
    code: output.code,
    changed: output.changed,
    stats: output.stats,
    classStrings: output.classNodes.map((n) => n.rawString)
  };
}

const workerId = (workerData as { workerId?: number })?.workerId ?? 0;

if (parentPort) {
  parentPort.on("message", (msg: JobMessage) => {
    if (msg.type !== "job") return;
    const { id, filePath, config, mode } = msg;
    processOne(filePath, config, mode)
      .then((output) => {
        parentPort!.postMessage({
          type: "result",
          workerId,
          id,
          filePath,
          output,
          error: null
        } satisfies ResultMessage);
      })
      .catch((err: unknown) => {
        parentPort!.postMessage({
          type: "result",
          workerId,
          id,
          filePath,
          output: null,
          error: err instanceof Error ? err.message : String(err)
        } satisfies ResultMessage);
      });
  });
}
