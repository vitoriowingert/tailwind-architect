import type { UtilityToken } from "./types.js";

const REDUNDANCY_RULES: Record<string, string[]> = {
  "p-": ["px-", "py-", "pt-", "pb-", "pl-", "pr-"],
  "m-": ["mx-", "my-", "mt-", "mb-", "ml-", "mr-"],
  "px-": ["pl-", "pr-"],
  "py-": ["pt-", "pb-"],
  "mx-": ["ml-", "mr-"],
  "my-": ["mt-", "mb-"]
};

function utilityPrefix(utility: string): string | null {
  if (/^p-\S+/.test(utility)) return "p-";
  if (/^m-\S+/.test(utility)) return "m-";
  if (/^px-\S+/.test(utility)) return "px-";
  if (/^py-\S+/.test(utility)) return "py-";
  if (/^pt-\S+/.test(utility)) return "pt-";
  if (/^pb-\S+/.test(utility)) return "pb-";
  if (/^pl-\S+/.test(utility)) return "pl-";
  if (/^pr-\S+/.test(utility)) return "pr-";
  if (/^mx-\S+/.test(utility)) return "mx-";
  if (/^my-\S+/.test(utility)) return "my-";
  if (/^mt-\S+/.test(utility)) return "mt-";
  if (/^mb-\S+/.test(utility)) return "mb-";
  if (/^ml-\S+/.test(utility)) return "ml-";
  if (/^mr-\S+/.test(utility)) return "mr-";
  return null;
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
    const prefixToToken = new Map<string, UtilityToken>();
    for (const token of groupTokens) {
      const prefix = utilityPrefix(token.utility);
      if (prefix) {
        prefixToToken.set(prefix, token);
      }
    }

    for (const [parent, children] of Object.entries(REDUNDANCY_RULES)) {
      const parentToken = prefixToToken.get(parent);
      if (!parentToken) continue;

      for (const child of children) {
        const childToken = prefixToToken.get(child);
        if (childToken) {
          removed.add(childToken);
        }
      }
    }
  }

  return {
    kept: tokens.filter((token) => !removed.has(token)),
    removed: tokens.filter((token) => removed.has(token))
  };
}
