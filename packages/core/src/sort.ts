import type { UtilityToken } from "./types.js";

const GROUP_WEIGHTS: Array<{ name: string; test: (utility: string) => boolean }> = [
  {
    name: "layout",
    test: (utility) =>
      [
        "block",
        "inline-block",
        "inline",
        "flex",
        "grid",
        "hidden",
        "relative",
        "absolute",
        "fixed",
        "sticky",
        "container"
      ].includes(utility)
  },
  {
    name: "alignment",
    test: (utility) =>
      utility.startsWith("items-") ||
      utility.startsWith("justify-") ||
      utility.startsWith("content-") ||
      utility.startsWith("self-")
  },
  {
    name: "sizing",
    test: (utility) =>
      utility.startsWith("w-") ||
      utility.startsWith("h-") ||
      utility.startsWith("min-") ||
      utility.startsWith("max-")
  },
  {
    name: "spacing",
    test: (utility) =>
      utility.startsWith("p-") ||
      utility.startsWith("px-") ||
      utility.startsWith("py-") ||
      utility.startsWith("pt-") ||
      utility.startsWith("pb-") ||
      utility.startsWith("pl-") ||
      utility.startsWith("pr-") ||
      utility.startsWith("m-") ||
      utility.startsWith("mx-") ||
      utility.startsWith("my-") ||
      utility.startsWith("mt-") ||
      utility.startsWith("mb-") ||
      utility.startsWith("ml-") ||
      utility.startsWith("mr-") ||
      utility.startsWith("gap-")
  },
  {
    name: "typography",
    test: (utility) =>
      utility.startsWith("font-") ||
      utility.startsWith("text-") ||
      utility.startsWith("leading-") ||
      utility.startsWith("tracking-")
  },
  {
    name: "visual",
    test: (utility) =>
      utility.startsWith("bg-") ||
      utility.startsWith("border") ||
      utility.startsWith("rounded") ||
      utility.startsWith("shadow")
  },
  {
    name: "effects",
    test: (utility) =>
      utility.startsWith("opacity-") ||
      utility.startsWith("transition") ||
      utility.startsWith("duration-") ||
      utility.startsWith("ease-") ||
      utility.startsWith("transform")
  },
  {
    name: "misc",
    test: () => true
  }
];

function groupWeight(utility: string): number {
  return GROUP_WEIGHTS.findIndex((entry) => entry.test(utility));
}

export function sortUtilities(tokens: UtilityToken[]): UtilityToken[] {
  return [...tokens].sort((a, b) => {
    const groupDelta = groupWeight(a.utility) - groupWeight(b.utility);
    if (groupDelta !== 0) {
      return groupDelta;
    }

    const variantDelta = a.variants.join(":").localeCompare(b.variants.join(":"));
    if (variantDelta !== 0) {
      return variantDelta;
    }

    return a.utility.localeCompare(b.utility);
  });
}
