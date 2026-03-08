import { detectConflicts } from "./conflicts.js";
import { detectOptimizationSuggestions } from "./optimize.js";
import { removeRedundant } from "./redundancy.js";
import { sortUtilities } from "./sort.js";
import { parseTokens, serializeTokens } from "./tokenize.js";
import type { AnalysisResult, AnalyzerConfig } from "./types.js";

type AnalyzeClassListOptions = {
  tailwindPrefix?: string;
};

export function analyzeClassList(
  classNames: string[],
  config: AnalyzerConfig,
  options: AnalyzeClassListOptions = {}
): AnalysisResult {
  const parsed = parseTokens(classNames);
  const original = serializeTokens(parsed);
  const conflicts = config.detectConflicts
    ? detectConflicts(parsed, { tailwindPrefix: options.tailwindPrefix })
    : [];
  const {
    kept: redundantFiltered,
    removed
  } = config.removeRedundant ? removeRedundant(parsed) : { kept: parsed, removed: [] };
  const suggestions = detectOptimizationSuggestions(redundantFiltered);
  const sorted = config.sortClasses ? sortUtilities(redundantFiltered) : redundantFiltered;
  const transformed = serializeTokens(sorted);

  return {
    original,
    sorted: serializeTokens(config.sortClasses ? sortUtilities(parsed) : parsed),
    transformed,
    redundantRemoved: serializeTokens(removed),
    conflicts,
    suggestions,
    didChange: original.join(" ") !== transformed.join(" ")
  };
}
