import type { ConflictKind, UtilityToken } from "./types.js";

const VISUAL_PREFIXES = ["bg-", "text-", "border-", "shadow", "opacity-"];
const SIZE_PREFIXES = ["w-", "h-", "min-w-", "min-h-", "max-w-", "max-h-"];
const SPACING_PREFIXES = [
  "p-",
  "px-",
  "py-",
  "pt-",
  "pb-",
  "pl-",
  "pr-",
  "m-",
  "mx-",
  "my-",
  "mt-",
  "mb-",
  "ml-",
  "mr-",
  "gap-",
  "space-x-",
  "space-y-"
];

const DISPLAY_UTILITIES = new Set([
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

export function utilityPropertyKey(token: UtilityToken): string | null {
  const utility = token.utility;

  if (DISPLAY_UTILITIES.has(utility)) {
    return "display";
  }

  if (utility.startsWith("bg-")) {
    return "background-color";
  }

  if (utility.startsWith("text-")) {
    return "color-or-typography";
  }

  if (utility.startsWith("w-") || utility.startsWith("min-w-") || utility.startsWith("max-w-")) {
    return "width";
  }

  if (utility.startsWith("h-") || utility.startsWith("min-h-") || utility.startsWith("max-h-")) {
    return "height";
  }

  if (utility.startsWith("p-") || utility.startsWith("px-") || utility.startsWith("py-")) {
    return "padding";
  }

  if (utility.startsWith("m-") || utility.startsWith("mx-") || utility.startsWith("my-")) {
    return "margin";
  }

  if (utility.startsWith("pt-") || utility.startsWith("pb-") || utility.startsWith("pl-") || utility.startsWith("pr-")) {
    return utility.slice(0, 2);
  }

  if (utility.startsWith("mt-") || utility.startsWith("mb-") || utility.startsWith("ml-") || utility.startsWith("mr-")) {
    return utility.slice(0, 2);
  }

  if (utility.startsWith("gap-")) {
    return "gap";
  }

  return null;
}

export function utilityConflictKind(token: UtilityToken): ConflictKind {
  const utility = token.utility;

  if (DISPLAY_UTILITIES.has(utility)) {
    return "display";
  }

  if (VISUAL_PREFIXES.some((prefix) => utility.startsWith(prefix))) {
    return "color";
  }

  if (SIZE_PREFIXES.some((prefix) => utility.startsWith(prefix))) {
    return "size";
  }

  if (SPACING_PREFIXES.some((prefix) => utility.startsWith(prefix))) {
    return "spacing";
  }

  return "other";
}
