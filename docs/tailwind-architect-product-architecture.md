# Tailwind Architect --- Product Architecture Blueprint

This document defines the **complete architecture of Tailwind
Architect** as a production-grade developer tool.

It describes:

-   monorepo structure
-   package responsibilities
-   internal engine APIs
-   extension architecture
-   CLI architecture
-   data flow between components
-   scalability considerations

------------------------------------------------------------------------

# 1. High-Level Architecture

Tailwind Architect is composed of three main layers:

Core Engine\
CLI Interface\
Editor Extensions

Architecture overview:

source code ↓ core engine (analysis + transformation) ↓ interfaces ├ CLI
└ editor extension

The **core engine must remain framework-agnostic**.

------------------------------------------------------------------------

# 2. Monorepo Structure

Recommended layout:

tailwind-architect │ ├ packages │ │ ├ core │ │ Tailwind analysis engine
│ │ ├ cli │ │ command-line interface │ │ ├ vscode-extension │ │ VSCode /
Cursor extension │ │ └ shared │ shared utilities and types │ ├ examples
├ docs └ website

------------------------------------------------------------------------

# 3. Core Engine Responsibilities

Package:

@tailwind-architect/core

Responsibilities:

-   AST parsing
-   class extraction
-   tokenization
-   variant parsing
-   Tailwind utility resolution
-   redundancy detection
-   conflict detection
-   optimization suggestions
-   semantic sorting
-   AST rewriting

The engine must expose a **clean API** used by CLI and extensions.

------------------------------------------------------------------------

# 4. Core Engine API

Example public API:

analyzeClassList(input: string)

Returns:

{ sortedClasses conflicts redundancies suggestions }

------------------------------------------------------------------------

Example source analysis:

analyzeSource(code: string, options)

Returns:

{ modifiedSource diagnostics statistics }

------------------------------------------------------------------------

# 5. CLI Architecture

Package:

tailwind-architect (CLI)

Responsibilities:

-   project scanning
-   batch processing
-   concurrency control
-   reporting

Commands:

tailwind-architect analyze tailwind-architect fix tailwind-architect
lint

Example usage:

tailwind-architect analyze ./src

------------------------------------------------------------------------

# 6. Extension Architecture

Package:

tailwind-architect-vscode

Supported editors:

Visual Studio Code\
Cursor IDE

Features:

-   command palette actions
-   inline diagnostics
-   quick fixes
-   format-on-save

Example command:

Tailwind Architect: Fix Classes

------------------------------------------------------------------------

# 7. Data Flow

Extension flow:

editor file ↓ extension request ↓ core engine analyzeSource ↓ results ↓
editor diagnostics + quick fixes

CLI flow:

project scan ↓ file batching ↓ core engine analyzeSource ↓ aggregate
results ↓ report output

------------------------------------------------------------------------

# 8. Configuration System

User configuration file:

tailwind-architect.config.json

Example:

{ "sortClasses": true, "removeRedundant": true, "detectConflicts": true,
"readabilityMode": false, "autoFix": true, "classFunctions":
\["clsx","cn","cva"\] }

Config should be loaded per workspace root.

------------------------------------------------------------------------

# 9. Tailwind Integration

The system must dynamically resolve Tailwind utilities.

Steps:

1.  locate tailwind.config
2.  resolve Tailwind config
3.  create Tailwind context
4.  resolve utilities

This ensures compatibility with:

Tailwind v3\
Tailwind v4\
future versions

------------------------------------------------------------------------

# 10. Performance Architecture

Target:

very large repositories.

Examples:

10k--100k files

Optimization techniques:

-   Tailwind context caching
-   AST reuse
-   worker thread processing
-   batched scanning

Cache key:

projectRoot + tailwindConfigHash

------------------------------------------------------------------------

# 11. Safety Strategy

Never transform unsafe expressions.

Examples:

bg-${color}-500
`text-${size}\`

These must be skipped.

Transformations must always occur via AST nodes.

------------------------------------------------------------------------

# 12. Plugin Architecture

Future extensibility.

Example plugin interface:

tailwind-architect-plugin

Plugins may provide:

-   custom lint rules
-   custom sorting rules
-   design system enforcement

------------------------------------------------------------------------

# 13. Testing Strategy

Three test levels:

Unit tests Core algorithms

Integration tests Full JSX / component analysis

Performance tests Large repositories

------------------------------------------------------------------------

# 14. Documentation Strategy

Required documentation:

-   installation guide
-   CLI usage
-   extension usage
-   configuration guide
-   troubleshooting

------------------------------------------------------------------------

# 15. Release Pipeline

Suggested release flow:

1.  publish npm CLI
2.  publish VSCode extension
3.  update docs
4.  release GitHub tag

------------------------------------------------------------------------

# 16. Long-Term System Vision

Tailwind Architect becomes:

The **static analysis platform for Tailwind CSS**.

Comparable ecosystem tools:

ESLint → JavaScript linting

Prettier → code formatting

Tailwind Architect → Tailwind optimization

------------------------------------------------------------------------

# Final Architecture Goal

A modular platform where:

core engine powers

CLI editor extensions CI integrations plugin ecosystem
