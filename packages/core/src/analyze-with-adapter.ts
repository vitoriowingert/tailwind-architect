import { analyzeClassList } from "./analyze-class-list.js";
import { splitClassString } from "./tokenize.js";
import type {
  AnalyzerConfig,
  ClassStringSpan,
  ReportClassDetails,
  TailwindArchitectPlugin
} from "./types.js";

export type AdapterAnalysisResult = {
  code: string;
  changed: boolean;
  stats: {
    conflictCount: number;
    redundancyCount: number;
    suggestionCount: number;
  };
  details?: ReportClassDetails[];
};

function offsetToLineColumn(
  code: string,
  offset: number
): { line: number; column: number } {
  const lines = code.slice(0, offset).split("\n");
  const line = lines.length;
  const column = (lines[lines.length - 1] ?? "").length;
  return { line, column };
}

function toReportClassDetails(
  analysis: ReturnType<typeof analyzeClassList>,
  span: ClassStringSpan,
  code: string
): ReportClassDetails {
  const start = offsetToLineColumn(code, span.start);
  const end = offsetToLineColumn(code, span.end);
  return {
    location: {
      start: span.start,
      end: span.end,
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column
    },
    conflicts: analysis.conflicts.map((c) => ({
      kind: c.kind,
      property: c.property,
      tokens: c.tokens
    })),
    suggestions: analysis.suggestions.map((s) => ({
      before: s.before,
      after: s.after,
      kind: s.kind
    })),
    redundantRemoved: [...analysis.redundantRemoved],
    pluginLints:
      (analysis.pluginLints?.length ?? 0) > 0
        ? analysis.pluginLints!.map((l) => ({ message: l.message }))
        : undefined
  };
}

export async function analyzeSourceWithAdapter(
  code: string,
  config: AnalyzerConfig,
  spans: ClassStringSpan[],
  options: {
    tailwindPrefix?: string;
    applyFixes?: boolean;
    plugins?: TailwindArchitectPlugin[];
    includeDetails?: boolean;
  } = {}
): Promise<AdapterAnalysisResult> {
  const {
    tailwindPrefix,
    applyFixes = true,
    plugins,
    includeDetails = false
  } = options;
  const stats = { conflictCount: 0, redundancyCount: 0, suggestionCount: 0 };
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const details: ReportClassDetails[] = [];

  for (const span of spans) {
    const classList = splitClassString(span.classString);
    if (classList.length === 0) continue;
    const analysis = analyzeClassList(classList, config, {
      tailwindPrefix,
      plugins
    });
    stats.conflictCount += analysis.conflicts.length;
    stats.redundancyCount += analysis.redundantRemoved.length;
    stats.suggestionCount +=
      analysis.suggestions.length + (analysis.pluginLints?.length ?? 0);
    if (includeDetails) {
      details.push(toReportClassDetails(analysis, span, code));
    }
    if (applyFixes) {
      const transformed = analysis.transformed.join(" ");
      if (transformed !== span.classString) {
        replacements.push({
          start: span.start,
          end: span.end,
          value: transformed
        });
      }
    }
  }

  if (replacements.length === 0) {
    return {
      code,
      changed: false,
      stats,
      ...(includeDetails ? { details } : {})
    };
  }

  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let output = code;
  for (const r of sorted) {
    output = output.slice(0, r.start) + r.value + output.slice(r.end);
  }
  return {
    code: output,
    changed: true,
    stats,
    ...(includeDetails ? { details } : {})
  };
}
