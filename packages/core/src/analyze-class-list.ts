import { detectConflicts } from "./conflicts.js";
import { detectOptimizationSuggestions } from "./optimize.js";
import { removeRedundant } from "./redundancy.js";
import { sortUtilities } from "./sort.js";
import { parseTokens, serializeTokens } from "./tokenize.js";
import type {
  AnalysisResult,
  AnalyzerConfig,
  PluginLintResult,
  TailwindArchitectPlugin
} from "./types.js";

type AnalyzeClassListOptions = {
  tailwindPrefix?: string;
  plugins?: TailwindArchitectPlugin[];
};

export function analyzeClassList(
  classNames: string[],
  config: AnalyzerConfig,
  options: AnalyzeClassListOptions = {}
): AnalysisResult {
  const parsed = parseTokens(classNames);
  const original = serializeTokens(parsed);
  const variantStack = parsed[0]?.variants ?? [];
  const conflicts = config.detectConflicts
    ? detectConflicts(parsed, { tailwindPrefix: options.tailwindPrefix })
    : [];
  const {
    kept: redundantFiltered,
    removed
  } = config.removeRedundant ? removeRedundant(parsed) : { kept: parsed, removed: [] };
  let suggestions = detectOptimizationSuggestions(redundantFiltered);

  const pluginLints: PluginLintResult[] = [];
  if (options.plugins?.length) {
    const ctx = { classList: original, variantStack };
    for (const plugin of options.plugins) {
      for (const rule of plugin.lintRules ?? []) {
        pluginLints.push(...rule(ctx));
      }
      const extra = plugin.suggest?.(ctx) ?? [];
      suggestions = [...suggestions, ...extra];
    }
  }

  const extraGroups = options.plugins?.flatMap((p) => p.sortGroups ?? []);
  const sortClasses = config.sortClasses !== false;
  const sorted = sortClasses
    ? sortUtilities(redundantFiltered, { extraGroups })
    : redundantFiltered;
  const transformed = serializeTokens(sorted);

  return {
    original,
    sorted: serializeTokens(
      sortClasses ? sortUtilities(parsed, { extraGroups }) : parsed
    ),
    transformed,
    redundantRemoved: serializeTokens(removed),
    conflicts,
    suggestions,
    pluginLints: pluginLints.length > 0 ? pluginLints : undefined,
    didChange: original.join(" ") !== transformed.join(" ")
  };
}
