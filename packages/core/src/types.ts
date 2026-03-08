export type FeatureFlags = {
  sortClasses: boolean;
  removeRedundant: boolean;
  detectConflicts: boolean;
  readabilityMode: boolean;
  autoFix: boolean;
};

export type ConflictKind = "override" | "redundancy" | "impossible-combination";

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
  property: string | null;
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
  transformed: string[];
  redundantRemoved: string[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
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

export type FileIssue = {
  filePath: string;
  conflictCount: number;
  redundancyCount: number;
  suggestionCount: number;
};

export type FileParseError = {
  filePath: string;
  message: string;
};

export type ProjectAnalysis = {
  filesScanned: number;
  filesWithIssues: number;
  conflictCount: number;
  redundancyCount: number;
  suggestionCount: number;
  parseErrorCount: number;
  parseErrors: FileParseError[];
  perFile: FileIssue[];
};
