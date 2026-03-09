import type { SortGroup, UtilityToken } from "./types.js";

const LAYOUT_UTILITIES = new Set([
  "block", "inline-block", "inline", "flex", "grid", "hidden",
  "relative", "absolute", "fixed", "sticky", "container",
  "flex-col", "flex-col-reverse", "flex-row", "flex-row-reverse",
  "flex-wrap", "flex-wrap-reverse", "flex-nowrap"
]);

const GROUP_WEIGHTS: Array<{ name: string; test: (utility: string) => boolean }> = [
  {
    name: "layout",
    test: (utility) => LAYOUT_UTILITIES.has(utility)
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
      utility.startsWith("gap-") ||
      utility.startsWith("space-x-") ||
      utility.startsWith("space-y-")
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

type SortOptions = { extraGroups?: SortGroup[] };

function buildWeights(extraGroups: SortGroup[] = []): Array<{ test: (utility: string) => boolean }> {
  const base = GROUP_WEIGHTS.map((g) => ({ test: g.test }));
  const extra = extraGroups.map((g) => ({ test: g.test }));
  return [...base, ...extra];
}

function groupWeight(utility: string, weights: Array<{ test: (utility: string) => boolean }>): number {
  const i = weights.findIndex((entry) => entry.test(utility));
  return i >= 0 ? i : weights.length;
}

export function sortUtilities(
  tokens: UtilityToken[],
  options: SortOptions = {}
): UtilityToken[] {
  const weights = buildWeights(options.extraGroups);
  return [...tokens].sort((a, b) => {
    const groupDelta = groupWeight(a.utility, weights) - groupWeight(b.utility, weights);
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
