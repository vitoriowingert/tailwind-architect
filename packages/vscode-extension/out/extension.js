import * as vscode from "vscode";
import * as path from "path";
const DIAGNOSTIC_COLLECTION_NAME = "tailwindArchitect";
/** Fallback when loadArchitectConfig returns nothing (e.g. no config file or bundle edge case). */
const FALLBACK_CONFIG = {
    sortClasses: true,
    removeRedundant: true,
    detectConflicts: true,
    readabilityMode: false,
    autoFix: true,
    classFunctions: ["clsx", "cn", "cva", "tw"],
    plugins: []
};
/** When running Fix command, always apply sort + redundant + conflicts so the command organizes classes. */
function configForFix(base) {
    return {
        ...base,
        sortClasses: true,
        removeRedundant: true,
        detectConflicts: true,
        autoFix: true
    };
}
const SUPPORTED_LANGUAGES = new Set([
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "astro",
    "svelte"
]);
const SUPPORTED_EXTENSIONS = new Set([".vue", ".astro", ".svelte"]);
function isSupportedDocument(doc) {
    if (SUPPORTED_LANGUAGES.has(doc.languageId))
        return true;
    const ext = path.extname(doc.uri.fsPath);
    return SUPPORTED_EXTENSIONS.has(ext);
}
function getWorkspaceRoot() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder)
        return null;
    return folder.uri.fsPath;
}
async function analyzeDocument(doc) {
    const root = getWorkspaceRoot();
    if (!root)
        return null;
    try {
        const core = await import("@tailwind-architect/core");
        if (!core?.loadArchitectConfig || !core?.loadTailwindContext)
            return null;
        const configRaw = await core.loadArchitectConfig(root);
        const config = !configRaw || typeof configRaw !== "object" ? FALLBACK_CONFIG : configRaw;
        const dir = doc.uri.fsPath.replace(/[/\\][^/\\]+$/, "").replace(/^$/, root);
        const tailwindContext = await core.loadTailwindContext(dir);
        const ext = path.extname(doc.uri.fsPath);
        const getAdapter = core.getAdapterForExtension;
        const adapter = getAdapter?.(ext);
        if (adapter && typeof adapter === "function") {
            const code = doc.getText();
            const spans = await adapter(doc.uri.fsPath, code);
            const prefix = tailwindContext && typeof tailwindContext === "object" && "resolvedConfig" in tailwindContext
                ? tailwindContext.resolvedConfig?.prefix
                : undefined;
            const result = await core.analyzeSourceWithAdapter(code, config, spans, {
                tailwindPrefix: prefix,
                applyFixes: false
            });
            return result;
        }
        const output = core.analyzeSourceCode(doc.getText(), config, {
            applyFixes: false,
            tailwindContext
        });
        return output;
    }
    catch {
        return null;
    }
}
function outputToDiagnostics(doc, output) {
    const diagnostics = [];
    const { conflictCount, redundancyCount, suggestionCount } = output.stats;
    const total = conflictCount + redundancyCount + suggestionCount;
    if (total === 0)
        return diagnostics;
    const range = new vscode.Range(0, 0, 0, 0);
    const parts = [];
    if (conflictCount > 0)
        parts.push(`${conflictCount} conflict(s)`);
    if (redundancyCount > 0)
        parts.push(`${redundancyCount} redundant`);
    if (suggestionCount > 0)
        parts.push(`${suggestionCount} suggestion(s)`);
    diagnostics.push(new vscode.Diagnostic(range, `Tailwind Architect: ${parts.join(", ")}. Run "Tailwind Architect: Fix Classes" to fix.`, vscode.DiagnosticSeverity.Information));
    return diagnostics;
}
function spanLevelDiagnostics(doc, classNodes, config, tailwindPrefix, core) {
    const diagnostics = [];
    const analyze = core?.analyzeClassList;
    if (typeof analyze !== "function")
        return diagnostics;
    for (const node of classNodes) {
        const result = analyze(node.classes, config, { tailwindPrefix });
        const hasIssues = result.conflicts.length > 0 ||
            result.redundantRemoved.length > 0 ||
            result.suggestions.length > 0;
        if (!hasIssues)
            continue;
        const start = doc.positionAt(node.location.start);
        const end = doc.positionAt(node.location.end);
        const parts = [];
        if (result.conflicts.length > 0)
            parts.push(`${result.conflicts.length} conflict(s)`);
        if (result.redundantRemoved.length > 0)
            parts.push("redundant");
        if (result.suggestions.length > 0)
            parts.push(`${result.suggestions.length} suggestion(s)`);
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(start, end), `Tailwind Architect: ${parts.join(", ")}. Run "Fix Classes" to fix.`, vscode.DiagnosticSeverity.Information));
    }
    return diagnostics;
}
async function updateDiagnostics(doc, collection) {
    if (!isSupportedDocument(doc)) {
        collection.delete(doc.uri);
        return;
    }
    let spanLevel = false;
    try {
        const tailwindArchitectConfig = vscode.workspace.getConfiguration?.("tailwindArchitect");
        spanLevel = tailwindArchitectConfig?.get?.("diagnosticsAtSpanLevel") ?? false;
    }
    catch {
        // no workspace or config not ready
    }
    if (spanLevel) {
        const root = getWorkspaceRoot();
        if (!root) {
            collection.delete(doc.uri);
            return;
        }
        try {
            const core = await import("@tailwind-architect/core");
            if (!core?.loadArchitectConfig || !core?.loadTailwindContext || !core?.extractClassNodesFromSource) {
                collection.delete(doc.uri);
                return;
            }
            const configRaw = await core.loadArchitectConfig(root);
            const config = !configRaw || typeof configRaw !== "object" ? FALLBACK_CONFIG : configRaw;
            const dir = doc.uri.fsPath.replace(/[/\\][^/\\]+$/, "").replace(/^$/, root);
            const tailwindContext = await core.loadTailwindContext(dir);
            const prefix = tailwindContext && typeof tailwindContext === "object" && "resolvedConfig" in tailwindContext
                ? tailwindContext.resolvedConfig?.prefix
                : undefined;
            const classNodes = core.extractClassNodesFromSource(doc.getText(), config, { tailwindContext });
            const diagnostics = spanLevelDiagnostics(doc, classNodes, config, prefix, core);
            collection.set(doc.uri, diagnostics);
        }
        catch {
            collection.delete(doc.uri);
        }
        return;
    }
    const output = await analyzeDocument(doc);
    if (!output) {
        collection.delete(doc.uri);
        return;
    }
    const diagnostics = outputToDiagnostics(doc, output);
    collection.set(doc.uri, diagnostics);
}
async function fixDocument(editor) {
    const doc = editor.document;
    if (!isSupportedDocument(doc)) {
        vscode.window.showWarningMessage("Tailwind Architect: Unsupported file type.");
        return;
    }
    const root = getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Tailwind Architect: No workspace folder open.");
        return;
    }
    try {
        const core = await import("@tailwind-architect/core");
        if (!core?.loadArchitectConfig || !core?.loadTailwindContext) {
            vscode.window.showErrorMessage("Tailwind Architect: Core module failed to load.");
            return;
        }
        const configRaw = await core.loadArchitectConfig(root);
        const baseConfig = !configRaw || typeof configRaw !== "object" ? FALLBACK_CONFIG : configRaw;
        const config = configForFix(baseConfig);
        const dir = doc.uri.fsPath.replace(/[/\\][^/\\]+$/, "").replace(/^$/, root);
        const tailwindContext = await core.loadTailwindContext(dir);
        const ext = path.extname(doc.uri.fsPath);
        const getAdapter = core.getAdapterForExtension;
        const adapter = getAdapter?.(ext);
        let output;
        const docText = doc.getText();
        if (adapter && typeof adapter === "function") {
            const spans = await adapter(doc.uri.fsPath, docText);
            const prefix = tailwindContext && typeof tailwindContext === "object" && "resolvedConfig" in tailwindContext
                ? tailwindContext.resolvedConfig?.prefix
                : undefined;
            output = await core.analyzeSourceWithAdapter(docText, config, spans, {
                tailwindPrefix: prefix,
                applyFixes: true
            });
        }
        else {
            const analyzeSourceCode = core.analyzeSourceCode;
            if (typeof analyzeSourceCode !== "function") {
                vscode.window.showErrorMessage("Tailwind Architect: analyzeSourceCode not available.");
                return;
            }
            const rawPath = doc.uri.fsPath || "";
            const ext = path.extname(rawPath);
            const hasTsxExt = /\.(tsx|jsx)$/i.test(ext);
            const hasBracketsInPath = /\[|\]/.test(rawPath);
            let filename;
            if (doc.uri.scheme === "file" && rawPath && hasTsxExt) {
                filename = hasBracketsInPath ? path.basename(rawPath) : rawPath;
            }
            else {
                filename = doc.languageId === "typescriptreact"
                    ? "component.tsx"
                    : doc.languageId === "javascriptreact"
                        ? "component.jsx"
                        : "component.tsx";
            }
            output = analyzeSourceCode(docText, config, {
                applyFixes: true,
                tailwindContext,
                filename
            });
            let codeChanged = output.code !== docText;
            if (!codeChanged && /className\s*=/.test(docText)) {
                output = analyzeSourceCode(docText, config, {
                    applyFixes: true,
                    tailwindContext,
                    filename: "file.tsx"
                });
                codeChanged = output.code !== docText;
            }
            if (!codeChanged) {
                vscode.window.showInformationMessage("Tailwind Architect: No changes needed.");
                return;
            }
        }
        const codeChanged = output.code !== docText;
        if (!codeChanged) {
            vscode.window.showInformationMessage("Tailwind Architect: No changes needed.");
            return;
        }
        const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
        await editor.edit((editBuilder) => {
            editBuilder.replace(fullRange, output.code);
        });
        const collection = getDiagnosticCollection();
        if (collection)
            collection.delete(doc.uri);
    }
    catch (err) {
        vscode.window.showErrorMessage(`Tailwind Architect: ${err instanceof Error ? err.message : String(err)}`);
    }
}
let diagnosticCollection = null;
function getDiagnosticCollection() {
    return diagnosticCollection;
}
export function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_COLLECTION_NAME);
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(vscode.commands.registerCommand("tailwindArchitect.fixClasses", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("Tailwind Architect: No active editor.");
            return;
        }
        await fixDocument(editor);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("tailwindArchitect.fixWorkspace", async () => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showWarningMessage("Tailwind Architect: No workspace folder open.");
            return;
        }
        try {
            const core = await import("@tailwind-architect/core");
            if (!core?.loadArchitectConfig || typeof core.analyzeProject !== "function") {
                vscode.window.showErrorMessage("Tailwind Architect: Core module failed to load.");
                return;
            }
            const configRaw = await core.loadArchitectConfig(root);
            const baseConfig = !configRaw || typeof configRaw !== "object" ? FALLBACK_CONFIG : configRaw;
            const config = configForFix(baseConfig);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Tailwind Architect: Fixing workspace..."
            }, async () => {
                const { report, changedFiles } = await core.analyzeProject({
                    rootDir: root,
                    config,
                    mode: "fix"
                });
                const collection = getDiagnosticCollection();
                if (collection) {
                    for (const uri of changedFiles) {
                        collection.delete(vscode.Uri.file(uri));
                    }
                }
                vscode.window.showInformationMessage(`Tailwind Architect: Fixed ${changedFiles.length} file(s). Scanned ${report.filesScanned}, ${report.filesWithIssues} with issues.`);
            });
        }
        catch (err) {
            vscode.window.showErrorMessage(`Tailwind Architect: ${err instanceof Error ? err.message : String(err)}`);
        }
    }));
    const updateDoc = (doc) => {
        const col = getDiagnosticCollection();
        if (col)
            updateDiagnostics(doc, col);
    };
    if (vscode.window.activeTextEditor && isSupportedDocument(vscode.window.activeTextEditor.document)) {
        updateDoc(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(updateDoc));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        updateDoc(doc);
    }));
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument((e) => {
        let formatOnSave = false;
        try {
            const tailwindConfig = vscode.workspace.getConfiguration?.("tailwindArchitect");
            formatOnSave = tailwindConfig?.get?.("formatOnSave") ?? false;
        }
        catch {
            // ignore
        }
        if (!formatOnSave || !isSupportedDocument(e.document))
            return;
        const editor = vscode.window.visibleTextEditors.find((ed) => ed.document.uri.toString() === e.document.uri.toString());
        if (editor)
            e.waitUntil(fixDocument(editor));
    }));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: "javascript", scheme: "file" }, {
        provideCodeActions(doc) {
            if (!isSupportedDocument(doc))
                return [];
            return [
                {
                    title: "Tailwind Architect: Fix Classes",
                    command: "tailwindArchitect.fixClasses",
                    kind: vscode.CodeActionKind.QuickFix
                }
            ];
        }
    }));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: "javascriptreact", scheme: "file" }, {
        provideCodeActions(doc) {
            if (!isSupportedDocument(doc))
                return [];
            return [
                {
                    title: "Tailwind Architect: Fix Classes",
                    command: "tailwindArchitect.fixClasses",
                    kind: vscode.CodeActionKind.QuickFix
                }
            ];
        }
    }));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: "typescript", scheme: "file" }, {
        provideCodeActions(doc) {
            if (!isSupportedDocument(doc))
                return [];
            return [
                {
                    title: "Tailwind Architect: Fix Classes",
                    command: "tailwindArchitect.fixClasses",
                    kind: vscode.CodeActionKind.QuickFix
                }
            ];
        }
    }));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: "typescriptreact", scheme: "file" }, {
        provideCodeActions(doc) {
            if (!isSupportedDocument(doc))
                return [];
            return [
                {
                    title: "Tailwind Architect: Fix Classes",
                    command: "tailwindArchitect.fixClasses",
                    kind: vscode.CodeActionKind.QuickFix
                }
            ];
        }
    }));
    for (const lang of ["vue", "astro", "svelte"]) {
        context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: lang, scheme: "file" }, {
            provideCodeActions(doc) {
                if (!isSupportedDocument(doc))
                    return [];
                return [
                    {
                        title: "Tailwind Architect: Fix Classes",
                        command: "tailwindArchitect.fixClasses",
                        kind: vscode.CodeActionKind.QuickFix
                    }
                ];
            }
        }));
    }
}
export function deactivate() {
    diagnosticCollection?.dispose();
    diagnosticCollection = null;
}
//# sourceMappingURL=extension.js.map