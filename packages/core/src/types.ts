import type { TailwindContext } from "./tailwind-context.js";

export type {
  AnalyzerConfig,
  DuplicatePattern,
  FeatureFlags,
  FileIssue,
  FileParseError,
  ProjectAnalysis
} from "@tailwind-architect/shared";

export type UtilityResolver = {
  resolveToProperties(utility: string, context?: TailwindContext | null): string[];
};

export type ConflictKind = "override" | "redundancy" | "impossible-combination";

export type UtilityToken = {
  raw: string;
  variants: string[];
  utility: string;
};

export type Conflict = {
  kind: ConflictKind;
  property: string | null;
  tokens: [string, string];
};

export type Suggestion = {
  before: [string, string];
  after: string;
  kind: "merge-axis" | "extract-pattern";
};

export type AnalysisResult = {
  original: string[];
  sorted: string[];
  transformed: string[];
  redundantRemoved: string[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
  pluginLints?: PluginLintResult[];
  didChange: boolean;
};

export type ClassNode = {
  location: {
    start: number;
    end: number;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  rawString: string;
  classes: string[];
  variantStack: string[];
};

export type ClassStringSpan = {
  start: number;
  end: number;
  classString: string;
};

export type SourceAdapter = (
  filePath: string,
  code: string
) => Promise<ClassStringSpan[]>;

export type PluginLintContext = {
  classList: string[];
  variantStack: string[];
};

export type PluginLintResult = { message: string };

export type SortGroup = {
  name: string;
  test: (utility: string) => boolean;
  order?: number;
};

export type TailwindArchitectPlugin = {
  name: string;
  lintRules?: Array<(context: PluginLintContext) => PluginLintResult[]>;
  sortGroups?: SortGroup[];
  suggest?: (context: { classList: string[]; variantStack: string[] }) => Suggestion[];
};
