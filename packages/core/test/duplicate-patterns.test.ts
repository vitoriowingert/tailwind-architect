import { describe, expect, it } from "vitest";
import { findDuplicatePatterns } from "../src/duplicate-patterns.js";

describe("findDuplicatePatterns", () => {
  it("returns empty when no pattern appears in multiple files", () => {
    const data = [
      { filePath: "/a.ts", classStrings: ["flex gap-2"] },
      { filePath: "/b.ts", classStrings: ["grid p-4"] }
    ];
    expect(findDuplicatePatterns(data, 2)).toEqual([]);
  });

  it("returns pattern that appears in at least minOccurrences files", () => {
    const data = [
      { filePath: "/a.ts", classStrings: ["flex items-center gap-2"] },
      { filePath: "/b.ts", classStrings: ["flex items-center gap-2"] }
    ];
    const result = findDuplicatePatterns(data, 2);
    expect(result).toHaveLength(1);
    expect(result[0].pattern).toEqual(["flex", "gap-2", "items-center"]);
    expect(result[0].occurrences).toBe(2);
    expect(result[0].filePaths).toContain("/a.ts");
    expect(result[0].filePaths).toContain("/b.ts");
  });

  it("respects minOccurrences threshold", () => {
    const data = [
      { filePath: "/a.ts", classStrings: ["flex gap-2"] },
      { filePath: "/b.ts", classStrings: ["grid p-4"] }
    ];
    expect(findDuplicatePatterns(data, 3)).toEqual([]);
  });

  it("normalizes class string order", () => {
    const data = [
      { filePath: "/a.ts", classStrings: ["gap-2 flex items-center"] },
      { filePath: "/b.ts", classStrings: ["flex items-center gap-2"] }
    ];
    const result = findDuplicatePatterns(data, 2);
    expect(result).toHaveLength(1);
    expect(result[0].pattern.sort()).toEqual(["flex", "gap-2", "items-center"].sort());
  });
});
