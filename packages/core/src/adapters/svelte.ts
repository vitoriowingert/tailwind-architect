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

export async function extractSvelteClassSpans(
  _filePath: string,
  code: string
): Promise<ClassStringSpan[]> {
  return extractFromFragment(code, 0);
}
