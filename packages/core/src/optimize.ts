import type { Suggestion, UtilityToken } from "./types.js";

type AxisPair = {
  first: string;
  second: string;
  mergedPrefix: string;
};

const AXIS_PAIRS: AxisPair[] = [
  { first: "pt-", second: "pb-", mergedPrefix: "py-" },
  { first: "pl-", second: "pr-", mergedPrefix: "px-" },
  { first: "mt-", second: "mb-", mergedPrefix: "my-" },
  { first: "ml-", second: "mr-", mergedPrefix: "mx-" }
];

function valueFromPrefix(utility: string, prefix: string): string | null {
  return utility.startsWith(prefix) ? utility.slice(prefix.length) : null;
}

export function detectOptimizationSuggestions(tokens: UtilityToken[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();
  const tokenSet = new Set(tokens.map((token) => token.raw));

  for (const pair of AXIS_PAIRS) {
    const firstMatches = tokens.filter((token) => token.utility.startsWith(pair.first));
    const secondMatches = tokens.filter((token) => token.utility.startsWith(pair.second));

    for (const first of firstMatches) {
      const firstValue = valueFromPrefix(first.utility, pair.first);
      if (!firstValue) continue;

      const second = secondMatches.find((item) => {
        const secondValue = valueFromPrefix(item.utility, pair.second);
        return secondValue === firstValue && item.variants.join(":") === first.variants.join(":");
      });
      if (!second) continue;

      const after = `${first.variants.length ? `${first.variants.join(":")}:` : ""}${pair.mergedPrefix}${firstValue}`;
      if (tokenSet.has(after)) continue;
      const key = `${first.raw}|${second.raw}|${after}`;
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push({
        kind: "merge-axis",
        before: [first.raw, second.raw],
        after
      });
    }
  }

  return suggestions;
}
