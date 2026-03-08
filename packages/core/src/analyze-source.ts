import { parse } from "@babel/parser";
import * as generator from "@babel/generator";
import * as traverseLib from "@babel/traverse";
import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { analyzeClassList } from "./analyze-class-list.js";
import { splitClassString } from "./tokenize.js";
import type { AnalyzerConfig, ProjectAnalysis } from "./types.js";

type SourceStats = {
  conflictCount: number;
  redundancyCount: number;
  suggestionCount: number;
  classesTouched: number;
};

export type SourceAnalysisOutput = {
  code: string;
  changed: boolean;
  stats: SourceStats;
};

function staticTemplateValue(node: t.TemplateLiteral): string | null {
  if (node.expressions.length > 0 || node.quasis.length !== 1) {
    return null;
  }
  return node.quasis[0]?.value.cooked ?? null;
}

function rewriteTemplate(node: t.TemplateLiteral, value: string): void {
  if (node.expressions.length > 0 || node.quasis.length !== 1) return;
  node.quasis[0].value.cooked = value;
  node.quasis[0].value.raw = value;
}

function processClassValue(
  classValue: string,
  config: AnalyzerConfig,
  stats: SourceStats
): string {
  const classList = splitClassString(classValue);
  if (classList.length === 0) {
    return classValue;
  }

  const analysis = analyzeClassList(classList, config);
  stats.conflictCount += analysis.conflicts.length;
  stats.redundancyCount += analysis.redundantRemoved.length;
  stats.suggestionCount += analysis.suggestions.length;
  stats.classesTouched += 1;

  const redundantSet = new Set(analysis.redundantRemoved);
  const transformed = analysis.sorted.filter((value) => !redundantSet.has(value)).join(" ");

  return transformed === analysis.original.join(" ") ? classValue : transformed;
}

function visitExpressionForClassStrings(
  node: t.Node,
  config: AnalyzerConfig,
  stats: SourceStats
): boolean {
  let changed = false;

  if (t.isStringLiteral(node)) {
    const next = processClassValue(node.value, config, stats);
    if (next !== node.value) {
      node.value = next;
      changed = true;
    }
    return changed;
  }

  if (t.isTemplateLiteral(node)) {
    const value = staticTemplateValue(node);
    if (value === null) {
      return false;
    }
    const next = processClassValue(value, config, stats);
    if (next !== value) {
      rewriteTemplate(node, next);
      changed = true;
    }
    return changed;
  }

  if (t.isArrayExpression(node)) {
    for (const element of node.elements) {
      if (!element || t.isSpreadElement(element)) continue;
      changed = visitExpressionForClassStrings(element, config, stats) || changed;
    }
  }

  if (t.isConditionalExpression(node)) {
    changed = visitExpressionForClassStrings(node.consequent, config, stats) || changed;
    changed = visitExpressionForClassStrings(node.alternate, config, stats) || changed;
  }

  if (t.isLogicalExpression(node)) {
    changed = visitExpressionForClassStrings(node.right, config, stats) || changed;
  }

  if (t.isObjectExpression(node)) {
    for (const property of node.properties) {
      if (t.isObjectProperty(property) && t.isExpression(property.key)) {
        changed = visitExpressionForClassStrings(property.key, config, stats) || changed;
      }
    }
  }

  return changed;
}

function isClassAttribute(name: t.JSXIdentifier | t.JSXNamespacedName): boolean {
  return t.isJSXIdentifier(name) && (name.name === "className" || name.name === "class");
}

export function analyzeSourceCode(code: string, config: AnalyzerConfig): SourceAnalysisOutput {
  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"]
  });

  const stats: SourceStats = {
    conflictCount: 0,
    redundancyCount: 0,
    suggestionCount: 0,
    classesTouched: 0
  };

  let changed = false;

  const traverse = ((traverseLib as unknown as { default?: (...args: unknown[]) => void }).default ??
    (traverseLib as unknown as (...args: unknown[]) => void)) as (
    tree: t.File,
    visitor: Record<string, unknown>
  ) => void;

  traverse(ast, {
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      if (!isClassAttribute(path.node.name) || !path.node.value) return;

      if (t.isStringLiteral(path.node.value)) {
        const next = processClassValue(path.node.value.value, config, stats);
        if (next !== path.node.value.value) {
          path.node.value.value = next;
          changed = true;
        }
        return;
      }

      if (t.isJSXExpressionContainer(path.node.value)) {
        changed = visitExpressionForClassStrings(path.node.value.expression, config, stats) || changed;
      }
    },
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!t.isIdentifier(path.node.callee)) return;
      if (!config.classFunctions.includes(path.node.callee.name)) return;

      for (const arg of path.node.arguments) {
        if (!t.isExpression(arg)) continue;
        changed = visitExpressionForClassStrings(arg, config, stats) || changed;
      }
    }
  });

  if (!changed) {
    return { code, changed: false, stats };
  }

  const generate = ((generator as unknown as { default?: (...args: unknown[]) => { code: string } })
    .default ??
    (generator as unknown as (...args: unknown[]) => { code: string })) as (
    tree: t.File,
    options: Record<string, unknown>
  ) => { code: string };

  const output = generate(ast, {
    retainLines: true
  }).code;

  return {
    code: output,
    changed: true,
    stats
  };
}

export function emptyProjectAnalysis(): ProjectAnalysis {
  return {
    filesScanned: 0,
    filesWithIssues: 0,
    conflictCount: 0,
    redundancyCount: 0,
    suggestionCount: 0,
    perFile: []
  };
}
