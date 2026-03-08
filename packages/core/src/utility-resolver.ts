import { twMerge } from "tailwind-merge";
import { parseToken, splitClassString } from "./tokenize.js";
import type { ConflictKind, UtilityToken } from "./types.js";

const DISPLAY_IMPOSSIBLE = new Set([
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "table",
  "hidden"
]);

const FONT_SIZE_VALUES = new Set([
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl"
]);

function textProperty(utility: string): string {
  const value = utility.slice("text-".length);
  if (FONT_SIZE_VALUES.has(value) || /^\[[^\]]+\]$/.test(value)) {
    return "font-size";
  }
  if (["left", "center", "right", "justify", "start", "end"].includes(value)) {
    return "text-align";
  }
  return "color";
}

export function resolveUtilityProperty(token: UtilityToken): string | null {
  const utility = token.utility;

  if (DISPLAY_IMPOSSIBLE.has(utility)) return "display";
  if (utility.startsWith("bg-")) return "background-color";
  if (utility.startsWith("text-")) return textProperty(utility);
  if (utility.startsWith("w-") || utility.startsWith("min-w-") || utility.startsWith("max-w-")) {
    return "width";
  }
  if (utility.startsWith("h-") || utility.startsWith("min-h-") || utility.startsWith("max-h-")) {
    return "height";
  }
  if (utility.startsWith("p-") || utility.startsWith("px-") || utility.startsWith("py-")) return "padding";
  if (utility.startsWith("m-") || utility.startsWith("mx-") || utility.startsWith("my-")) return "margin";
  if (utility.startsWith("pt-") || utility.startsWith("pb-") || utility.startsWith("pl-") || utility.startsWith("pr-")) {
    return utility.slice(0, 2);
  }
  if (utility.startsWith("mt-") || utility.startsWith("mb-") || utility.startsWith("ml-") || utility.startsWith("mr-")) {
    return utility.slice(0, 2);
  }
  if (utility.startsWith("gap-")) return "gap";
  return null;
}

function hasToken(classList: string[], token: string): boolean {
  return classList.includes(token);
}

function isImpossibleCombination(previous: UtilityToken, current: UtilityToken): boolean {
  return (
    DISPLAY_IMPOSSIBLE.has(previous.utility) &&
    DISPLAY_IMPOSSIBLE.has(current.utility) &&
    previous.utility !== current.utility
  );
}

export function classifyPairConflict(
  previous: UtilityToken,
  current: UtilityToken,
  options: { tailwindPrefix?: string } = {}
): { kind: ConflictKind; property: string | null } | null {
  if (previous.raw === current.raw) {
    return { kind: "redundancy", property: resolveUtilityProperty(current) };
  }

  const normalizedPrevious = normalizeForMerge(previous.raw, options.tailwindPrefix);
  const normalizedCurrent = normalizeForMerge(current.raw, options.tailwindPrefix);
  const mergedOutput = splitClassString(twMerge(`${normalizedPrevious} ${normalizedCurrent}`));
  const hasPrevious = hasToken(mergedOutput, normalizedPrevious);
  const hasCurrent = hasToken(mergedOutput, normalizedCurrent);

  if (hasPrevious && hasCurrent) {
    return null;
  }

  if (!hasPrevious && !hasCurrent) {
    return { kind: "impossible-combination", property: resolveUtilityProperty(current) };
  }

  if (!hasPrevious && hasCurrent) {
    return {
      kind: isImpossibleCombination(previous, current) ? "impossible-combination" : "override",
      property: resolveUtilityProperty(current)
    };
  }

  return { kind: "redundancy", property: resolveUtilityProperty(current) };
}

function normalizeForMerge(raw: string, tailwindPrefix?: string): string {
  if (!tailwindPrefix) return raw;
  const parsed = parseToken(raw);
  if (!parsed.utility.startsWith(tailwindPrefix)) {
    return raw;
  }
  const normalizedUtility = parsed.utility.slice(tailwindPrefix.length);
  return parsed.variants.length ? `${parsed.variants.join(":")}:${normalizedUtility}` : normalizedUtility;
}
