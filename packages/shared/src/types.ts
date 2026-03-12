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

export type LogEntry = {
  level: "info" | "warn";
  message: string;
};

/** Serializable conflict for report (mirror of core Conflict). */
export type ReportConflict = {
  kind: "override" | "redundancy" | "impossible-combination";
  property: string | null;
  tokens: [string, string];
};

/** Serializable suggestion for report (mirror of core Suggestion). */
export type ReportSuggestion = {
  before: [string, string];
  after: string;
  kind: "merge-axis" | "extract-pattern";
};

/** Per-class-string details: location + issues. */
export type ReportClassDetails = {
  location: {
    start: number;
    end: number;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  conflicts: ReportConflict[];
  suggestions: ReportSuggestion[];
  redundantRemoved: string[];
  pluginLints?: { message: string }[];
};

/** Per-file detailed report (only when includeDetails is requested). */
export type PerFileDetailsEntry = {
  filePath: string;
  entries: ReportClassDetails[];
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
  /** When true, only the first `filesLimit` files were processed (maxFiles option). */
  truncated?: boolean;
  /** When truncated is true, this is the max files limit that was applied. */
  filesLimit?: number;
  /** Structured log entries (info/warn) for the run. */
  log?: LogEntry[];
  /** Full list of scanned file paths. */
  filesScannedPaths?: string[];
  /** Per-file details (conflicts, suggestions, etc.) when includeDetails is true. */
  perFileDetails?: PerFileDetailsEntry[];
};
