import { describe, expect, it } from "vitest";
import { parseToken, splitClassString } from "../src/tokenize.js";

describe("tokenize", () => {
  it("parses variant stacks correctly", () => {
    const token = parseToken("md:hover:bg-red-500");
    expect(token.variants).toEqual(["md", "hover"]);
    expect(token.utility).toBe("bg-red-500");
  });

  it("does not split variant separators inside arbitrary values", () => {
    const token = parseToken("bg-[url(http://a:b)]");
    expect(token.variants).toEqual([]);
    expect(token.utility).toBe("bg-[url(http://a:b)]");
  });

  it("splits class strings while respecting arbitrary containers", () => {
    const classes = splitClassString("bg-[url(http://a:b)] p-4 md:hover:bg-red-500");
    expect(classes).toEqual(["bg-[url(http://a:b)]", "p-4", "md:hover:bg-red-500"]);
  });
});
