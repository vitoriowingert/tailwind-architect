import type { ClassStringSpan } from "../types.js";

function extractFromFragment(code: string, offset: number): ClassStringSpan[] {
  const spans: ClassStringSpan[] = [];
  const classDouble = /class\s*=\s*"([^"]*)"/g;
  const classSingle = /class\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = classDouble.exec(code)) !== null) {
    const value = m[1];
    if (value.trim().length === 0) continue;
    const valueStart = offset + m.index + m[0].indexOf(value);
    spans.push({ start: valueStart, end: valueStart + value.length, classString: value });
  }
  while ((m = classSingle.exec(code)) !== null) {
    const value = m[1];
    if (value.trim().length === 0) continue;
    const valueStart = offset + m.index + m[0].indexOf(value);
    spans.push({ start: valueStart, end: valueStart + value.length, classString: value });
  }
  return spans;
}

export async function extractAstroClassSpans(
  _filePath: string,
  code: string
): Promise<ClassStringSpan[]> {
  const spans: ClassStringSpan[] = [];
  const frontmatterEnd = code.startsWith("---")
    ? code.indexOf("---", 3) + 3
    : 0;
  const body = code.slice(frontmatterEnd);
  spans.push(...extractFromFragment(body, frontmatterEnd));
  return spans;
}
