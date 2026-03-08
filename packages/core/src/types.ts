export type FeatureFlags = {
  sortClasses: boolean;
  removeRedundant: boolean;
  detectConflicts: boolean;
  readabilityMode: boolean;
  autoFix: boolean;
};

export type ConflictKind = "display" | "color" | "size" | "spacing" | "other";

export type AnalyzerConfig = FeatureFlags & {
  classFunctions: string[];
};

export type UtilityToken = {
  raw: string;
  variants: string[];
  utility: string;
};

export type Conflict = {
  kind: ConflictKind;
  property: string;
  tokens: [string, string];
};

export type Suggestion = {
  before: [string, string];
  after: string;
  kind: "merge-axis";
};

export type AnalysisResult = {
  original: string[];
  sorted: string[];
  redundantRemoved: string[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
  didChange: boolean;
};

export type FileIssue = {
  filePath: string;
  conflictCount: number;
  redundancyCount: number;
  suggestionCount: number;
};

export type ProjectAnalysis = {
  filesScanned: number;
  filesWithIssues: number;
  conflictCount: number;
  redundancyCount: number;
  suggestionCount: number;
  perFile: FileIssue[];
};
