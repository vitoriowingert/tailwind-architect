import type { DuplicatePattern } from "@tailwind-architect/shared";

function normalize(classString: string): string {
  return classString
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export type FileClassStrings = {
  filePath: string;
  classStrings: string[];
};

/**
 * Find class-string patterns that appear in multiple files.
 * @param filesData Per-file class strings (e.g. from analysis classNodes).
 * @param minOccurrences Minimum number of files for a pattern to be reported (default 2).
 */
export function findDuplicatePatterns(
  filesData: FileClassStrings[],
  minOccurrences = 2
): DuplicatePattern[] {
  const byNormalized = new Map<string, { filePaths: Set<string>; pattern: string[] }>();

  for (const { filePath, classStrings } of filesData) {
    const seen = new Set<string>();
    for (const raw of classStrings) {
      const key = normalize(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const pattern = key.split(/\s+/);
      const existing = byNormalized.get(key);
      if (existing) {
        existing.filePaths.add(filePath);
      } else {
        byNormalized.set(key, { filePaths: new Set([filePath]), pattern });
      }
    }
  }

  const result: DuplicatePattern[] = [];
  for (const { filePaths, pattern } of byNormalized.values()) {
    if (filePaths.size >= minOccurrences) {
      result.push({
        pattern,
        occurrences: filePaths.size,
        filePaths: [...filePaths].sort()
      });
    }
  }
  return result.sort((a, b) => b.occurrences - a.occurrences);
}
