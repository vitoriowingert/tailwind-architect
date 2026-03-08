import type { UtilityToken } from "./types.js";

export function splitClassString(input: string): string[] {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function parseToken(raw: string): UtilityToken {
  const parts = raw.split(":");
  const utility = parts.pop() ?? raw;
  const variants = parts;

  return { raw, variants, utility };
}

export function parseTokens(input: string[]): UtilityToken[] {
  return input.map(parseToken);
}

export function isDynamicToken(raw: string): boolean {
  return raw.includes("${");
}

export function serializeTokens(tokens: UtilityToken[]): string[] {
  return tokens.map((token) =>
    token.variants.length ? `${token.variants.join(":")}:${token.utility}` : token.utility
  );
}
