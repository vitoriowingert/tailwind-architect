import { describe, expect, it } from "vitest";
import { analyzeSourceCode } from "../src/analyze-source.js";
import { defaultConfig } from "../src/config.js";

describe("framework integration patterns", () => {
  it("handles Next-style component className expressions", () => {
    const source = `
      export function Page({ active }: { active: boolean }) {
        return (
          <main className={active ? "p-4 px-4 bg-white" : "p-4 px-4 bg-gray-50"}>
            Hello
          </main>
        );
      }
    `;
    const output = analyzeSourceCode(source, defaultConfig);
    expect(output.changed).toBe(true);
    expect(output.code).toContain('"p-4 bg-white"');
    expect(output.code).toContain('"p-4 bg-gray-50"');
  });

  it("handles shadcn cn()/clsx object and array patterns", () => {
    const source = `
      const classes = cn(
        ["flex", "items-center", "p-4", "px-4"],
        { "bg-red-500 bg-blue-500": hasError, "text-sm": compact }
      );
    `;
    const output = analyzeSourceCode(source, defaultConfig);
    expect(output.changed).toBe(true);
    expect(output.stats.conflictCount).toBeGreaterThan(0);
    expect(output.code).toContain('"p-4"');
  });
});
