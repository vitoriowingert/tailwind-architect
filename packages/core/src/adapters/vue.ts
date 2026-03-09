import type { ClassStringSpan } from "../types.js";

const CLASS_DOUBLE = /class\s*=\s*"([^"]*)"/g;
const CLASS_SINGLE = /class\s*=\s*'([^']*)'/g;

export async function extractVueClassSpans(
  _filePath: string,
  code: string
): Promise<ClassStringSpan[]> {
  const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  if (!templateMatch) return [];
  const template = templateMatch[1];
  const offset = templateMatch.index! + templateMatch[0].indexOf(template);
  const spans: ClassStringSpan[] = [];
  let m: RegExpExecArray | null;
  const re1 = new RegExp(CLASS_DOUBLE.source, CLASS_DOUBLE.flags);
  while ((m = re1.exec(template)) !== null) {
    const value = m[1];
    if (value.trim().length === 0) continue;
    const valueStart = offset + m.index + m[0].indexOf(value);
    spans.push({ start: valueStart, end: valueStart + value.length, classString: value });
  }
  const re2 = new RegExp(CLASS_SINGLE.source, CLASS_SINGLE.flags);
  while ((m = re2.exec(template)) !== null) {
    const value = m[1];
    if (value.trim().length === 0) continue;
    const valueStart = offset + m.index + m[0].indexOf(value);
    spans.push({ start: valueStart, end: valueStart + value.length, classString: value });
  }
  return spans;
}
