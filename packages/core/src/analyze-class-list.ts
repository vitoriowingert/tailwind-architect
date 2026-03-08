import { detectConflicts } from "./conflicts.js";
import { detectOptimizationSuggestions } from "./optimize.js";
import { removeRedundant } from "./redundancy.js";
import { sortUtilities } from "./sort.js";
import { parseTokens, serializeTokens } from "./tokenize.js";
import type { AnalysisResult, AnalyzerConfig } from "./types.js";

export function analyzeClassList(classNames: string[], config: AnalyzerConfig): AnalysisResult {
  const parsed = parseTokens(classNames);
  const original = serializeTokens(parsed);

  const sorted = config.sortClasses ? sortUtilities(parsed) : parsed;
  const {
    kept: redundantFiltered,
    removed
  } = config.removeRedundant ? removeRedundant(sorted) : { kept: sorted, removed: [] };
  const conflicts = config.detectConflicts ? detectConflicts(redundantFiltered) : [];
  const suggestions = detectOptimizationSuggestions(redundantFiltered);

  const output = serializeTokens(redundantFiltered);

  return {
    original,
    sorted: serializeTokens(sorted),
    redundantRemoved: serializeTokens(removed),
    conflicts,
    suggestions,
    didChange: original.join(" ") !== output.join(" ")
  };
}
