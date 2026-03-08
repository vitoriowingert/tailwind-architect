import type { Conflict, UtilityToken } from "./types.js";
import { utilityConflictKind, utilityPropertyKey } from "./utility-map.js";

function keyWithVariant(token: UtilityToken, property: string): string {
  return `${token.variants.join(":")}::${property}`;
}

export function detectConflicts(tokens: UtilityToken[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const seen = new Map<string, UtilityToken>();

  for (const token of tokens) {
    const property = utilityPropertyKey(token);
    if (!property) continue;

    const key = keyWithVariant(token, property);
    const previous = seen.get(key);
    if (previous && previous.utility !== token.utility) {
      conflicts.push({
        kind: utilityConflictKind(token),
        property,
        tokens: [previous.raw, token.raw]
      });
    }
    seen.set(key, token);
  }

  return conflicts;
}
