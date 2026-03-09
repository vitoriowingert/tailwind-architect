export { getAdapterForExtension } from "./adapters/index.js";
export { analyzeSourceWithAdapter } from "./analyze-with-adapter.js";
export { findDuplicatePatterns } from "./duplicate-patterns.js";
export { analyzeClassList } from "./analyze-class-list.js";
export { analyzeProject } from "./project.js";
export { analyzeSourceCode, extractClassNodesFromSource } from "./analyze-source.js";
export { loadArchitectConfig, defaultConfig } from "./config.js";
export { loadPlugins } from "./plugins.js";
export { loadTailwindContext } from "./tailwind-context.js";
export { ruleBasedResolver, resolveToProperties } from "./utility-resolver.js";
export type {
  AnalyzerConfig,
  AnalysisResult,
  ClassNode,
  ClassStringSpan,
  Conflict,
  ConflictKind,
  FeatureFlags,
  PluginLintContext,
  PluginLintResult,
  ProjectAnalysis,
  SortGroup,
  SourceAdapter,
  Suggestion,
  TailwindArchitectPlugin,
  UtilityResolver
} from "./types.js";
export type { TailwindContext, TailwindVersion } from "./tailwind-context.js";
