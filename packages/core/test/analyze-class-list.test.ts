import { describe, expect, it } from "vitest";
import { analyzeClassList } from "../src/analyze-class-list.js";
import { defaultConfig } from "../src/config.js";

describe("analyzeClassList", () => {
  it("sorts class names by semantic group", () => {
    const output = analyzeClassList(
      ["flex", "p-4", "w-full", "bg-white", "justify-center"],
      defaultConfig
    );

    expect(output.sorted.join(" ")).toBe("flex justify-center w-full p-4 bg-white");
  });

  it("removes redundant spacing tokens", () => {
    const output = analyzeClassList(["p-4", "px-4"], defaultConfig);
    expect(output.redundantRemoved).toEqual(["px-4"]);
  });

  it("detects display conflicts", () => {
    const output = analyzeClassList(["flex", "grid"], defaultConfig);
    expect(output.conflicts).toHaveLength(1);
    expect(output.conflicts[0]?.property).toBe("display");
  });

  it("detects merge-axis suggestions", () => {
    const output = analyzeClassList(["pt-4", "pb-4"], defaultConfig);
    expect(output.suggestions).toHaveLength(1);
    expect(output.suggestions[0]?.after).toBe("py-4");
  });
});
