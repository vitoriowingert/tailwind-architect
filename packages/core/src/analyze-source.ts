import { parse } from "@babel/parser";
import * as traverseLib from "@babel/traverse";
import * as t from "@babel/types";
import type { NodePath, TraverseOptions } from "@babel/traverse";
import { analyzeClassList } from "./analyze-class-list.js";
import { parseTokens, splitClassString } from "./tokenize.js";
import type {
  AnalyzerConfig,
  ClassNode,
  ProjectAnalysis,
  ReportClassDetails,
  TailwindArchitectPlugin
} from "./types.js";
import type { TailwindContext } from "./tailwind-context.js";
import type { AnalysisResult } from "./types.js";

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
  details?: ReportClassDetails[];
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

function toReportClassDetails(
  analysis: AnalysisResult,
  location: ClassNode["location"]
): ReportClassDetails {
  return {
    location: { ...location },
    conflicts: analysis.conflicts.map((c) => ({
      kind: c.kind,
      property: c.property,
      tokens: c.tokens
    })),
    suggestions: analysis.suggestions.map((s) => ({
      before: s.before,
      after: s.after,
      kind: s.kind
    })),
    redundantRemoved: [...analysis.redundantRemoved],
    pluginLints:
      (analysis.pluginLints?.length ?? 0) > 0
        ? analysis.pluginLints!.map((l) => ({ message: l.message }))
        : undefined
  };
}

type ProcessClassValueResult =
  | string
  | { value: string; analysis: AnalysisResult };

function processClassValue(
  classValue: string,
  config: AnalyzerConfig,
  stats: SourceStats,
  analysisCache: Map<string, ReturnType<typeof analyzeClassList>>,
  tailwindPrefix?: string,
  plugins?: TailwindArchitectPlugin[],
  includeDetails?: boolean
): ProcessClassValueResult {
  if (classValue.includes("${")) {
    return classValue;
  }

  const classList = splitClassString(classValue);
  if (classList.length === 0) {
    return classValue;
  }

  const pluginKey = plugins?.map((p) => p.name).join(",") ?? "";
  const sortClasses = config.sortClasses !== false;
  const cacheKey = `${tailwindPrefix ?? ""}|${pluginKey}|${sortClasses}|${config.removeRedundant}|${config.detectConflicts}|${config.readabilityMode}|${classValue}`;
  const analysis =
    analysisCache.get(cacheKey) ??
    analyzeClassList(classList, config, { tailwindPrefix, plugins });
  analysisCache.set(cacheKey, analysis);
  stats.conflictCount += analysis.conflicts.length;
  stats.redundancyCount += analysis.redundantRemoved.length;
  stats.suggestionCount +=
    analysis.suggestions.length + (analysis.pluginLints?.length ?? 0);
  stats.classesTouched += 1;

  const transformed = config.readabilityMode
    ? formatReadability(analysis.transformed)
    : analysis.transformed.join(" ");
  const value =
    transformed === analysis.original.join(" ") ? classValue : transformed;

  if (includeDetails) {
    return { value, analysis };
  }
  return value;
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
  replacements.push({
    start: node.start,
    end: node.end,
    value: JSON.stringify(value)
  });
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
  replacements.push({
    start: node.start,
    end: node.end,
    value: `\`${escapeTemplateValue(value)}\``
  });
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
  tailwindPrefix: string | undefined,
  plugins: TailwindArchitectPlugin[] | undefined,
  fileDetails: ReportClassDetails[],
  includeDetails: boolean
): boolean {
  if (node.start == null || node.end == null) return false;
  const visitKey = `${node.type}:${node.start}:${node.end}`;
  if (visited.has(visitKey)) {
    return false;
  }
  visited.add(visitKey);

  let changed = false;
  const pushDetail = (
    result: ProcessClassValueResult,
    location: ClassNode["location"]
  ): string => {
    const value = typeof result === "string" ? result : result.value;
    if (includeDetails && typeof result === "object" && result.analysis) {
      fileDetails.push(toReportClassDetails(result.analysis, location));
    }
    return value;
  };

  if (t.isStringLiteral(node)) {
    const extracted = classNodeForValue(node, node.value);
    if (extracted && extracted.classes.length > 0) {
      classNodes.push(extracted);
    }
    const result = processClassValue(
      node.value,
      config,
      stats,
      analysisCache,
      tailwindPrefix,
      plugins,
      includeDetails
    );
    const next = pushDetail(result, extracted?.location ?? getNodeLocation(node));
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
    const result = processClassValue(
      value,
      config,
      stats,
      analysisCache,
      tailwindPrefix,
      plugins,
      includeDetails
    );
    const next = pushDetail(result, extracted?.location ?? getNodeLocation(node));
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
          tailwindPrefix,
          plugins,
          fileDetails,
          includeDetails
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
        tailwindPrefix,
        plugins,
        fileDetails,
        includeDetails
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
        tailwindPrefix,
        plugins,
        fileDetails,
        includeDetails
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
        tailwindPrefix,
        plugins,
        fileDetails,
        includeDetails
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
            tailwindPrefix,
            plugins,
            fileDetails,
            includeDetails
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
              tailwindPrefix,
              plugins,
              fileDetails,
              includeDetails
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
              tailwindPrefix,
              plugins,
              fileDetails,
              includeDetails
            ) || changed;
        }
      }
    }
  }

  return changed;
}

function getNodeLocation(node: t.Node): ClassNode["location"] {
  const loc = node.loc;
  const start = node.start ?? 0;
  const end = node.end ?? start;
  return {
    start,
    end,
    startLine: loc?.start.line ?? 1,
    startColumn: loc?.start.column ?? 0,
    endLine: loc?.end.line ?? 1,
    endColumn: loc?.end.column ?? 0
  };
}

function isClassAttribute(
  name: t.JSXIdentifier | t.JSXNamespacedName
): boolean {
  return (
    t.isJSXIdentifier(name) &&
    (name.name === "className" || name.name === "class")
  );
}

type AnalyzeSourceOptions = {
  applyFixes?: boolean;
  tailwindContext?: TailwindContext | null;
  plugins?: TailwindArchitectPlugin[];
  /** File path or name (e.g. .tsx) so the parser treats the code as TSX/JSX. */
  filename?: string;
  /** When true, include per-class-string details (conflicts, suggestions, etc.) in the output. */
  includeDetails?: boolean;
};

function readTailwindPrefix(
  context: TailwindContext | null | undefined
): string | undefined {
  const resolved = context?.resolvedConfig as
    | { prefix?: unknown }
    | null
    | undefined;
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
  const plugins = options.plugins;
  const filename = options.filename ?? "module.tsx";
  const sourceType = /\.(tsx?|jsx?|mts|mjs|cjs)$/i.test(filename)
    ? "module"
    : "unambiguous";
  const ast = parse(code, {
    sourceType,
    plugins: ["jsx", "typescript", "decorators-legacy"],
    ...(filename ? { sourceFilename: filename } : {})
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
  const includeDetails = options.includeDetails === true;
  const fileDetails: ReportClassDetails[] = [];
  let changed = false;
  const tr = traverseLib as unknown as {
    default?:
      | ((tree: t.File, v: TraverseOptions<t.Node>) => void)
      | { default?: (tree: t.File, v: TraverseOptions<t.Node>) => void };
  };
  const cand = tr?.default;
  const traverseFn =
    (typeof cand === "function" ? cand : undefined) ??
    (typeof (cand as { default?: unknown } | undefined)?.default === "function"
      ? (
          cand as {
            default: (tree: t.File, visitor: TraverseOptions<t.Node>) => void;
          }
        ).default
      : undefined) ??
    (typeof traverseLib === "function"
      ? (traverseLib as (
          tree: t.File,
          visitor: TraverseOptions<t.Node>
        ) => void)
      : undefined);
  if (typeof traverseFn !== "function") {
    return {
      code,
      changed: false,
      stats,
      classNodes,
      ...(includeDetails ? { details: fileDetails } : {})
    };
  }
  const traverse = traverseFn as (
    tree: t.File,
    visitor: TraverseOptions<t.Node>
  ) => void;

  traverse(ast, {
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      if (!isClassAttribute(path.node.name) || !path.node.value) return;

      if (t.isStringLiteral(path.node.value)) {
        const extracted = classNodeForValue(
          path.node.value,
          path.node.value.value
        );
        if (extracted && extracted.classes.length > 0) {
          classNodes.push(extracted);
        }
        const result = processClassValue(
          path.node.value.value,
          config,
          stats,
          analysisCache,
          tailwindPrefix,
          plugins,
          includeDetails
        );
        const next =
          typeof result === "string"
            ? result
            : result.value;
        if (includeDetails && typeof result === "object" && result.analysis) {
          fileDetails.push(
            toReportClassDetails(result.analysis, extracted?.location ?? getNodeLocation(path.node.value))
          );
        }
        if (applyFixes) {
          const queued = queueStringLiteralReplacement(
            path.node.value,
            next,
            replacements
          );
          if (queued && next !== path.node.value.value) changed = true;
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
            tailwindPrefix,
            plugins,
            fileDetails,
            includeDetails
          ) || changed;
      }
    },
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!t.isIdentifier(path.node.callee)) return;
      const classFns = config.classFunctions ?? [];
      if (!Array.isArray(classFns) || !classFns.includes(path.node.callee.name))
        return;

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
            tailwindPrefix,
            plugins,
            fileDetails,
            includeDetails
          ) || changed;
      }
    }
  });

  if (applyFixes && replacements.length > 0) {
    const output = applyReplacements(code, replacements);
    const actuallyChanged = output !== code;
    return {
      code: output,
      changed: actuallyChanged,
      stats,
      classNodes,
      ...(includeDetails ? { details: fileDetails } : {})
    };
  }

  return {
    code,
    changed: false,
    stats,
    classNodes,
    ...(includeDetails ? { details: fileDetails } : {})
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
    perFile: [],
    log: []
  };
}
