import type { UtilityToken } from "./types.js";

const REDUNDANCY_RULES: Record<string, string[]> = {
  "p-": ["px-", "py-", "pt-", "pb-", "pl-", "pr-"],
  "m-": ["mx-", "my-", "mt-", "mb-", "ml-", "mr-"],
  "px-": ["pl-", "pr-"],
  "py-": ["pt-", "pb-"],
  "mx-": ["ml-", "mr-"],
  "my-": ["mt-", "mb-"]
};

type ParsedUtility = {
  prefix: string;
  value: string;
};

const PREFIXES = [
  "p-",
  "m-",
  "px-",
  "py-",
  "pt-",
  "pb-",
  "pl-",
  "pr-",
  "mx-",
  "my-",
  "mt-",
  "mb-",
  "ml-",
  "mr-"
];

function parseUtility(utility: string): ParsedUtility | null {
  const prefix = PREFIXES.find((item) => utility.startsWith(item));
  if (!prefix) return null;
  return {
    prefix,
    value: utility.slice(prefix.length)
  };
}

function byVariantStack(tokens: UtilityToken[]): Map<string, UtilityToken[]> {
  const map = new Map<string, UtilityToken[]>();
  for (const token of tokens) {
    const key = token.variants.join(":");
    map.set(key, [...(map.get(key) ?? []), token]);
  }
  return map;
}

export function removeRedundant(tokens: UtilityToken[]): {
  kept: UtilityToken[];
  removed: UtilityToken[];
} {
  const removed = new Set<UtilityToken>();
  const grouped = byVariantStack(tokens);

  for (const [, groupTokens] of grouped) {
    const byPrefixAndValue = new Map<string, UtilityToken[]>();
    const seenUtilities = new Set<string>();

    for (const token of groupTokens) {
      const key = `${token.utility}`;
      if (seenUtilities.has(key)) {
        removed.add(token);
      } else {
        seenUtilities.add(key);
      }

      const parsed = parseUtility(token.utility);
      if (parsed) {
        const valueKey = `${parsed.prefix}|${parsed.value}`;
        byPrefixAndValue.set(valueKey, [...(byPrefixAndValue.get(valueKey) ?? []), token]);
      }
    }

    const displayToken = groupTokens.find((token) => token.utility === "flex");
    if (displayToken) {
      for (const token of groupTokens) {
        if (token.utility === "flex-row") {
          removed.add(token);
        }
      }
    }

    for (const [parent, children] of Object.entries(REDUNDANCY_RULES)) {
      for (const [key, parentTokens] of byPrefixAndValue.entries()) {
        const [prefix, value] = key.split("|");
        if (prefix !== parent) continue;
        if (parentTokens.length === 0) continue;

        for (const child of children) {
          const childTokens = byPrefixAndValue.get(`${child}|${value}`) ?? [];
          for (const childToken of childTokens) {
            removed.add(childToken);
          }
        }
      }
    }
  }

  return {
    kept: tokens.filter((token) => !removed.has(token)),
    removed: tokens.filter((token) => removed.has(token))
  };
}
