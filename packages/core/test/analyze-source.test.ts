import { describe, expect, it } from "vitest";
import { analyzeSourceCode, extractClassNodesFromSource } from "../src/analyze-source.js";
import { defaultConfig } from "../src/config.js";

describe("analyzeSourceCode", () => {
  it("rewrites static className strings in JSX", () => {
    const source = `const App = () => <div className="flex p-4 w-full bg-white justify-center" />;`;
    const output = analyzeSourceCode(source, defaultConfig);

    expect(output.changed).toBe(true);
    expect(output.code).toContain(`className="flex justify-center w-full p-4 bg-white"`);
  });

  it("rewrites static strings inside class helper calls", () => {
    const source = `const x = clsx("pt-4 pb-4", active && "bg-red-500 bg-blue-500");`;
    const output = analyzeSourceCode(source, defaultConfig);

    expect(output.changed).toBe(true);
    expect(output.stats.suggestionCount).toBeGreaterThan(0);
    expect(output.stats.conflictCount).toBeGreaterThan(0);
  });

  it("skips dynamic template literals", () => {
    const source = "const x = `bg-${color}-500`;";
    const output = analyzeSourceCode(source, defaultConfig);
    expect(output.changed).toBe(false);
  });

  it("parses decorators without throwing", () => {
    const source = `
      @sealed
      class Example {
        render() {
          return <div className="p-4 px-4" />;
        }
      }
    `;
    const output = analyzeSourceCode(source, defaultConfig);
    expect(output.changed).toBe(true);
    expect(output.code).toContain('className="p-4"');
  });

  it("extracts ClassNode metadata from static class strings", () => {
    const source = `const btn = cn("p-4 px-4", { "text-red-500": hasError });`;
    const nodes = extractClassNodesFromSource(source, defaultConfig);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0]).toMatchObject({
      rawString: "p-4 px-4"
    });
  });

  it("applies readability mode formatting for long class sets", () => {
    const source =
      'const App = () => <div className="flex items-center justify-center w-full max-w-xl p-6 gap-4 bg-white rounded shadow" />;';
    const output = analyzeSourceCode(source, { ...defaultConfig, readabilityMode: true });
    expect(output.changed).toBe(true);
    expect(output.code).toContain("\\n");
  });
});
