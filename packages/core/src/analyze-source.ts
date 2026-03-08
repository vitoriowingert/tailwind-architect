import { parse } from "@babel/parser";
import * as traverseLib from "@babel/traverse";
import * as t from "@babel/types";
import type { NodePath, TraverseOptions } from "@babel/traverse";
import { analyzeClassList } from "./analyze-class-list.js";
import { parseTokens, splitClassString } from "./tokenize.js";
import type { AnalyzerConfig, ClassNode, ProjectAnalysis } from "./types.js";
import type { TailwindContext } from "./tailwind-context.js";

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
  classNodes: ClassNode[];
};

function staticTemplateValue(node: t.TemplateLiteral): string | null {
  if (node.expressions.length > 0 || node.quasis.length !== 1) {
    return null;
  }
  return node.quasis[0]?.value.cooked ?? null;
}

function toVariantStack(value: string): string[] {
  const parsed = parseTokens(splitClassString(value));
  return [...new Set(parsed.flatMap((token) => token.variants))];
}

function classNodeForValue(node: t.Node, rawString: string): ClassNode | null {
  if (node.start == null || node.end == null || !node.loc) {
    return null;
  }
  return {
    location: {
      start: node.start,
      end: node.end,
      startLine: node.loc.start.line,
      startColumn: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column
    },
    rawString,
    classes: splitClassString(rawString),
    variantStack: toVariantStack(rawString)
  };
}

function formatReadability(classNames: string[]): string {
  if (classNames.length < 10) {
    return classNames.join(" ");
  }

  const chunked: string[] = [];
  for (let index = 0; index < classNames.length; index += 4) {
    chunked.push(classNames.slice(index, index + 4).join(" "));
  }
  return `\n${chunked.map((line) => `  ${line}`).join("\n")}\n`;
}

function processClassValue(
  classValue: string,
  config: AnalyzerConfig,
  stats: SourceStats,
  analysisCache: Map<string, ReturnType<typeof analyzeClassList>>,
  tailwindPrefix?: string
): string {
  if (classValue.includes("${")) {
    return classValue;
  }

  const classList = splitClassString(classValue);
  if (classList.length === 0) {
    return classValue;
  }

  const cacheKey = `${tailwindPrefix ?? ""}|${config.sortClasses}|${config.removeRedundant}|${config.detectConflicts}|${config.readabilityMode}|${classValue}`;
  const analysis = analysisCache.get(cacheKey) ?? analyzeClassList(classList, config, { tailwindPrefix });
  analysisCache.set(cacheKey, analysis);
  stats.conflictCount += analysis.conflicts.length;
  stats.redundancyCount += analysis.redundantRemoved.length;
  stats.suggestionCount += analysis.suggestions.length;
  stats.classesTouched += 1;

  const transformed = config.readabilityMode
    ? formatReadability(analysis.transformed)
    : analysis.transformed.join(" ");

  return transformed === analysis.original.join(" ") ? classValue : transformed;
}

function applyReplacements(
  source: string,
  replacements: Array<{ start: number; end: number; value: string }>
): string {
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let output = source;
  for (const replacement of sorted) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`;
  }
  return output;
}

function queueStringLiteralReplacement(
  node: t.StringLiteral,
  value: string,
  replacements: Array<{ start: number; end: number; value: string }>
): boolean {
  if (node.start == null || node.end == null) return false;
  replacements.push({ start: node.start, end: node.end, value: JSON.stringify(value) });
  return true;
}

function escapeTemplateValue(value: string): string {
  return value.replace(/[`\\]/g, "\\$&");
}

function queueTemplateReplacement(
  node: t.TemplateLiteral,
  value: string,
  replacements: Array<{ start: number; end: number; value: string }>
): boolean {
  if (node.start == null || node.end == null) return false;
  replacements.push({ start: node.start, end: node.end, value: `\`${escapeTemplateValue(value)}\`` });
  return true;
}

function visitExpressionForClassStrings(
  node: t.Node,
  config: AnalyzerConfig,
  stats: SourceStats,
  analysisCache: Map<string, ReturnType<typeof analyzeClassList>>,
  classNodes: ClassNode[],
  replacements: Array<{ start: number; end: number; value: string }>,
  visited: Set<string>,
  applyFixes: boolean,
  tailwindPrefix?: string
): boolean {
  if (node.start == null || node.end == null) return false;
  const visitKey = `${node.type}:${node.start}:${node.end}`;
  if (visited.has(visitKey)) {
    return false;
  }
  visited.add(visitKey);

  let changed = false;

  if (t.isStringLiteral(node)) {
    const extracted = classNodeForValue(node, node.value);
    if (extracted && extracted.classes.length > 0) {
      classNodes.push(extracted);
    }
    const next = processClassValue(node.value, config, stats, analysisCache, tailwindPrefix);
    if (next !== node.value && applyFixes) {
      changed = queueStringLiteralReplacement(node, next, replacements);
    }
    return changed;
  }

  if (t.isTemplateLiteral(node)) {
    const value = staticTemplateValue(node);
    if (value === null) {
      return false;
    }
    const extracted = classNodeForValue(node, value);
    if (extracted && extracted.classes.length > 0) {
      classNodes.push(extracted);
    }
    const next = processClassValue(value, config, stats, analysisCache, tailwindPrefix);
    if (next !== value && applyFixes) {
      changed = queueTemplateReplacement(node, next, replacements);
    }
    return changed;
  }

  if (t.isArrayExpression(node)) {
    for (const element of node.elements) {
      if (!element || t.isSpreadElement(element)) continue;
      changed =
        visitExpressionForClassStrings(
          element,
          config,
          stats,
          analysisCache,
          classNodes,
          replacements,
          visited,
          applyFixes,
          tailwindPrefix
        ) || changed;
    }
  }

  if (t.isConditionalExpression(node)) {
    changed =
      visitExpressionForClassStrings(
        node.consequent,
        config,
        stats,
        analysisCache,
        classNodes,
        replacements,
        visited,
        applyFixes,
        tailwindPrefix
      ) || changed;
    changed =
      visitExpressionForClassStrings(
        node.alternate,
        config,
        stats,
        analysisCache,
        classNodes,
        replacements,
        visited,
        applyFixes,
        tailwindPrefix
      ) || changed;
  }

  if (t.isLogicalExpression(node)) {
    changed =
      visitExpressionForClassStrings(
        node.right,
        config,
        stats,
        analysisCache,
        classNodes,
        replacements,
        visited,
        applyFixes,
        tailwindPrefix
      ) || changed;
  }

  if (t.isObjectExpression(node)) {
    for (const property of node.properties) {
      if (t.isSpreadElement(property) && t.isExpression(property.argument)) {
        changed =
          visitExpressionForClassStrings(
            property.argument,
            config,
            stats,
            analysisCache,
            classNodes,
            replacements,
            visited,
            applyFixes,
            tailwindPrefix
          ) || changed;
      }

      if (t.isObjectProperty(property)) {
        if (t.isStringLiteral(property.key)) {
          changed =
            visitExpressionForClassStrings(
              property.key,
              config,
              stats,
              analysisCache,
              classNodes,
              replacements,
              visited,
              applyFixes,
              tailwindPrefix
            ) || changed;
        } else if (property.computed && t.isExpression(property.key)) {
          changed =
            visitExpressionForClassStrings(
              property.key,
              config,
              stats,
              analysisCache,
              classNodes,
              replacements,
              visited,
              applyFixes,
              tailwindPrefix
            ) || changed;
        }
      }
    }
  }

  return changed;
}

function isClassAttribute(name: t.JSXIdentifier | t.JSXNamespacedName): boolean {
  return t.isJSXIdentifier(name) && (name.name === "className" || name.name === "class");
}

type AnalyzeSourceOptions = {
  applyFixes?: boolean;
  tailwindContext?: TailwindContext | null;
};

function readTailwindPrefix(context: TailwindContext | null | undefined): string | undefined {
  const resolved = context?.resolvedConfig as { prefix?: unknown } | null | undefined;
  return typeof resolved?.prefix === "string" && resolved.prefix.length > 0
    ? resolved.prefix
    : undefined;
}

export function analyzeSourceCode(
  code: string,
  config: AnalyzerConfig,
  options: AnalyzeSourceOptions = {}
): SourceAnalysisOutput {
  const tailwindPrefix = readTailwindPrefix(options.tailwindContext);
  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript", "decorators-legacy"]
  });

  const stats: SourceStats = {
    conflictCount: 0,
    redundancyCount: 0,
    suggestionCount: 0,
    classesTouched: 0
  };

  const classNodes: ClassNode[] = [];
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const analysisCache = new Map<string, ReturnType<typeof analyzeClassList>>();
  const visited = new Set<string>();
  const applyFixes = options.applyFixes ?? true;
  let changed = false;
  const traverse = ((traverseLib as unknown as { default?: (...args: unknown[]) => void }).default ??
    (traverseLib as unknown as (...args: unknown[]) => void)) as (
    tree: t.File,
    visitor: TraverseOptions<t.Node>
  ) => void;

  traverse(ast, {
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      if (!isClassAttribute(path.node.name) || !path.node.value) return;

      if (t.isStringLiteral(path.node.value)) {
        const extracted = classNodeForValue(path.node.value, path.node.value.value);
        if (extracted && extracted.classes.length > 0) {
          classNodes.push(extracted);
        }
        const next = processClassValue(
          path.node.value.value,
          config,
          stats,
          analysisCache,
          tailwindPrefix
        );
        if (next !== path.node.value.value && applyFixes) {
          changed = queueStringLiteralReplacement(path.node.value, next, replacements) || changed;
        }
        return;
      }

      if (
        t.isJSXExpressionContainer(path.node.value) &&
        !t.isCallExpression(path.node.value.expression)
      ) {
        changed =
          visitExpressionForClassStrings(
            path.node.value.expression,
            config,
            stats,
            analysisCache,
            classNodes,
            replacements,
            visited,
            applyFixes,
            tailwindPrefix
          ) || changed;
      }
    },
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!t.isIdentifier(path.node.callee)) return;
      if (!config.classFunctions.includes(path.node.callee.name)) return;

      for (const arg of path.node.arguments) {
        if (!t.isExpression(arg)) continue;
        changed =
          visitExpressionForClassStrings(
            arg,
            config,
            stats,
            analysisCache,
            classNodes,
            replacements,
            visited,
            applyFixes,
            tailwindPrefix
          ) || changed;
      }
    }
  });

  if (!changed) {
    return { code, changed: false, stats, classNodes };
  }

  const output = applyReplacements(code, replacements);

  return {
    code: output,
    changed: true,
    stats,
    classNodes
  };
}

export function extractClassNodesFromSource(
  code: string,
  config: AnalyzerConfig,
  options: Omit<AnalyzeSourceOptions, "applyFixes"> = {}
): ClassNode[] {
  return analyzeSourceCode(code, config, {
    ...options,
    applyFixes: false
  }).classNodes;
}

export function emptyProjectAnalysis(): ProjectAnalysis {
  return {
    filesScanned: 0,
    filesWithIssues: 0,
    conflictCount: 0,
    redundancyCount: 0,
    suggestionCount: 0,
    parseErrorCount: 0,
    parseErrors: [],
    perFile: []
  };
}
