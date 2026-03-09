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
    expect(output.conflicts.some((item) => item.property === "display")).toBe(true);
  });

  it("detects merge-axis suggestions", () => {
    const output = analyzeClassList(["pt-4", "pb-4"], defaultConfig);
    expect(output.suggestions).toHaveLength(1);
    expect(output.suggestions[0]?.after).toBe("py-4");
  });

  it("keeps non-conflicting text size and text color", () => {
    const output = analyzeClassList(["text-sm", "text-red-500"], defaultConfig);
    expect(output.conflicts).toHaveLength(0);
  });

  it("only removes spacing children when values match", () => {
    const output = analyzeClassList(["p-4", "px-2"], defaultConfig);
    expect(output.redundantRemoved).toEqual([]);
  });

  it("removes default flex-row when flex is present", () => {
    const output = analyzeClassList(["flex", "flex-row"], defaultConfig);
    expect(output.redundantRemoved).toEqual(["flex-row"]);
  });

  it("handles arbitrary value utilities without breaking", () => {
    const output = analyzeClassList(
      ["w-[37px]", "bg-[#123456]", "flex", "p-4"],
      defaultConfig
    );
    expect(output.transformed).toContain("w-[37px]");
    expect(output.transformed).toContain("bg-[#123456]");
    expect(output.conflicts).toHaveLength(0);
  });

  it("handles arbitrary values with colons inside brackets", () => {
    const output = analyzeClassList(
      ["bg-[url(http://a:b)]", "p-4"],
      defaultConfig
    );
    expect(output.transformed.join(" ")).toContain("bg-[url(http://a:b)]");
  });

  it("suggests merge-axis only within same variant scope (md:pt-4 md:pb-4 -> md:py-4)", () => {
    const output = analyzeClassList(
      ["md:pt-4", "md:pb-4"],
      defaultConfig
    );
    expect(output.suggestions).toHaveLength(1);
    expect(output.suggestions[0]?.after).toBe("md:py-4");
  });

  it("does not suggest merge across different variant scopes", () => {
    const output = analyzeClassList(
      ["pt-4", "md:pb-4"],
      defaultConfig
    );
    expect(output.suggestions).toHaveLength(0);
  });

  it("reorders login-page style string: layout then alignment then sizing then spacing then visual", () => {
    const classString = "flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4";
    const classes = classString.split(" ");
    const output = analyzeClassList(classes, defaultConfig);
    // layout (flex, flex-col) -> alignment (items-center, justify-center) -> sizing (min-h-screen) -> spacing (px-4) -> visual (bg-*)
    expect(output.transformed.join(" ")).toBe(
      "flex flex-col items-center justify-center min-h-screen px-4 bg-muted/30"
    );
    expect(output.didChange).toBe(true);
  });

  it("sorts by variant scope: base before md before hover", () => {
    const output = analyzeClassList(
      ["hover:bg-red-500", "md:p-4", "p-4"],
      defaultConfig
    );
    const transformed = output.transformed;
    const p4Index = transformed.indexOf("p-4");
    const mdP4Index = transformed.indexOf("md:p-4");
    const hoverIndex = transformed.indexOf("hover:bg-red-500");
    expect(p4Index).toBeLessThan(mdP4Index);
    expect(mdP4Index).toBeLessThan(hoverIndex);
  });
});
