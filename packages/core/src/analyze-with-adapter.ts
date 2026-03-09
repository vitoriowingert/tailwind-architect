import { analyzeClassList } from "./analyze-class-list.js";
import { splitClassString } from "./tokenize.js";
import type { AnalyzerConfig, ClassStringSpan, TailwindArchitectPlugin } from "./types.js";

export type AdapterAnalysisResult = {
  code: string;
  changed: boolean;
  stats: { conflictCount: number; redundancyCount: number; suggestionCount: number };
};

export async function analyzeSourceWithAdapter(
  code: string,
  config: AnalyzerConfig,
  spans: ClassStringSpan[],
  options: { tailwindPrefix?: string; applyFixes?: boolean; plugins?: TailwindArchitectPlugin[] } = {}
): Promise<AdapterAnalysisResult> {
  const { tailwindPrefix, applyFixes = true, plugins } = options;
  const stats = { conflictCount: 0, redundancyCount: 0, suggestionCount: 0 };
  const replacements: Array<{ start: number; end: number; value: string }> = [];

  for (const span of spans) {
    const classList = splitClassString(span.classString);
    if (classList.length === 0) continue;
    const analysis = analyzeClassList(classList, config, { tailwindPrefix, plugins });
    stats.conflictCount += analysis.conflicts.length;
    stats.redundancyCount += analysis.redundantRemoved.length;
    stats.suggestionCount += analysis.suggestions.length + (analysis.pluginLints?.length ?? 0);
    if (applyFixes) {
      const transformed = analysis.transformed.join(" ");
      if (transformed !== span.classString) {
        replacements.push({ start: span.start, end: span.end, value: transformed });
      }
    }
  }

  if (replacements.length === 0) {
    return { code, changed: false, stats };
  }

  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let output = code;
  for (const r of sorted) {
    output = output.slice(0, r.start) + r.value + output.slice(r.end);
  }
  return { code: output, changed: true, stats };
}
