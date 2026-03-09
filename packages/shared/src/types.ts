export type FeatureFlags = {
  sortClasses: boolean;
  removeRedundant: boolean;
  detectConflicts: boolean;
  readabilityMode: boolean;
  autoFix: boolean;
};

export type AnalyzerConfig = FeatureFlags & {
  classFunctions: string[];
  plugins?: string[];
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

export type DuplicatePattern = {
  pattern: string[];
  occurrences: number;
  filePaths: string[];
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
  duplicatePatterns?: DuplicatePattern[];
};
