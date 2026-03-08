import type { Conflict, UtilityToken } from "./types.js";
import { classifyPairConflict } from "./utility-resolver.js";

type ConflictDetectionOptions = {
  tailwindPrefix?: string;
};

export function detectConflicts(tokens: UtilityToken[], options: ConflictDetectionOptions = {}): Conflict[] {
  const conflicts: Conflict[] = [];
  const variantGroups = new Map<string, UtilityToken[]>();

  for (const token of tokens) {
    const variantKey = token.variants.join(":");
    variantGroups.set(variantKey, [...(variantGroups.get(variantKey) ?? []), token]);
  }

  for (const [, groupTokens] of variantGroups) {
    for (let currentIndex = 0; currentIndex < groupTokens.length; currentIndex += 1) {
      const current = groupTokens[currentIndex];
      for (let previousIndex = 0; previousIndex < currentIndex; previousIndex += 1) {
        const previous = groupTokens[previousIndex];
        const conflict = classifyPairConflict(previous, current, options);
        if (!conflict) continue;
        conflicts.push({
          kind: conflict.kind,
          property: conflict.property,
          tokens: [previous.raw, current.raw]
        });
      }
    }
  }

  return conflicts;
}
