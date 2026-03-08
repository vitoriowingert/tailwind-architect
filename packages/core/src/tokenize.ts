import type { UtilityToken } from "./types.js";

function isEscaped(input: string, index: number): boolean {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && input[i] === "\\"; i -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

export function splitClassString(input: string): string[] {
  const tokens: string[] = [];
  let depthSquare = 0;
  let depthRound = 0;
  let depthCurly = 0;
  let quote: "'" | '"' | null = null;
  let current = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if ((char === "'" || char === '"') && !isEscaped(input, i)) {
      if (quote === char) {
        quote = null;
      } else if (quote === null) {
        quote = char;
      }
      current += char;
      continue;
    }

    if (!quote) {
      if (char === "[") depthSquare += 1;
      else if (char === "]") depthSquare = Math.max(0, depthSquare - 1);
      else if (char === "(") depthRound += 1;
      else if (char === ")") depthRound = Math.max(0, depthRound - 1);
      else if (char === "{") depthCurly += 1;
      else if (char === "}") depthCurly = Math.max(0, depthCurly - 1);

      const inContainer = depthSquare > 0 || depthRound > 0 || depthCurly > 0;
      if (!inContainer && /\s/.test(char)) {
        if (current.trim()) {
          tokens.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

function splitTopLevelByColon(raw: string): string[] {
  const segments: string[] = [];
  let depthSquare = 0;
  let depthRound = 0;
  let depthCurly = 0;
  let quote: "'" | '"' | null = null;
  let current = "";

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if ((char === "'" || char === '"') && !isEscaped(raw, i)) {
      if (quote === char) {
        quote = null;
      } else if (quote === null) {
        quote = char;
      }
      current += char;
      continue;
    }

    if (!quote) {
      if (char === "[") depthSquare += 1;
      else if (char === "]") depthSquare = Math.max(0, depthSquare - 1);
      else if (char === "(") depthRound += 1;
      else if (char === ")") depthRound = Math.max(0, depthRound - 1);
      else if (char === "{") depthCurly += 1;
      else if (char === "}") depthCurly = Math.max(0, depthCurly - 1);

      const inContainer = depthSquare > 0 || depthRound > 0 || depthCurly > 0;
      if (!inContainer && char === ":") {
        segments.push(current);
        current = "";
        continue;
      }
    }

    current += char;
  }

  segments.push(current);
  return segments.filter(Boolean);
}

export function parseToken(raw: string): UtilityToken {
  const parts = splitTopLevelByColon(raw);
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
