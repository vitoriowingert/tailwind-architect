# Tailwind Architect --- Development Playbook

This playbook defines the step-by-step development process for building
Tailwind Architect from the current state to a production-ready
developer tool.

Current project state:

-   Monorepo initialized
-   Core engine created
-   AST parsing implemented
-   CLI commands implemented (analyze / fix / lint)
-   Initial tests implemented

Goal:

Ship a stable, scalable Tailwind analysis and refactor tool.

------------------------------------------------------------------------

# Phase 1 --- Stabilize Core Engine

Objective: Ensure the analysis engine behaves correctly with real
Tailwind code.

Tasks:

1.  Run CLI against real projects
2.  Expand test coverage
3.  Validate sorting behavior
4.  Validate redundancy detection
5.  Validate conflict detection

Command examples:

tailwind-architect analyze ./src tailwind-architect fix ./src
tailwind-architect lint ./src

Test against real ecosystems:

-   Next.js project
-   Tailwind UI examples
-   shadcn/ui components

------------------------------------------------------------------------

# Phase 2 --- Improve Utility Resolution

Goal: Improve precision of conflict detection.

Current model:

class → rule matching

Target model:

class ↓ Tailwind engine resolution ↓ CSS property mapping ↓ conflict
graph

Tasks:

-   Resolve utility → CSS properties
-   Map properties to utilities
-   Detect overlaps

------------------------------------------------------------------------

# Phase 3 --- Variant Engine

Add full support for Tailwind variants.

Examples:

hover:bg-red-500 md:flex dark:bg-black group-hover:opacity-100

Implementation steps:

1.  Parse variant stack
2.  Associate utilities with variant context
3.  Evaluate conflicts inside variant scope

------------------------------------------------------------------------

# Phase 4 --- Framework Adapters

Add support for non-React frameworks.

Adapters required:

react vue astro svelte

Example adapter structure:

adapters/ react.ts vue.ts astro.ts svelte.ts

Responsibilities:

-   extract class strings
-   return standardized ClassNode objects

------------------------------------------------------------------------

# Phase 5 --- VSCode / Cursor Extension

Create extension package:

packages/vscode-extension

Features:

-   Command palette command
-   Inline diagnostics
-   Quick fixes
-   Optional format-on-save

Command example:

Tailwind Architect: Fix Classes

------------------------------------------------------------------------

# Phase 6 --- CLI Improvements

Improve developer usability.

New CLI flags:

--dry-run --report json --max-workers

Example:

tailwind-architect analyze ./src --report json

------------------------------------------------------------------------

# Phase 7 --- Performance Layer

Goal: Support very large repositories.

Target scale:

10k+ files

Implement:

-   worker threads
-   AST cache
-   Tailwind context cache
-   concurrent scanning

Cache key:

projectRoot + tailwindConfigHash

------------------------------------------------------------------------

# Phase 8 --- Advanced Analysis

Add higher-level insights.

Duplicate Pattern Detection example:

flex items-center gap-2

Suggestion:

-   extract component
-   create utility class

------------------------------------------------------------------------

# Phase 9 --- Plugin System

Allow third-party rules.

Plugin interface example:

tailwind-architect-plugin

Plugin capabilities:

-   custom lint rules
-   custom sorting groups
-   design system enforcement

------------------------------------------------------------------------

# Phase 10 --- Release Preparation

Prepare for public distribution.

Tasks:

1.  Create documentation website
2.  Publish VSCode extension
3.  Publish npm CLI
4.  Create GitHub examples

------------------------------------------------------------------------

# Phase 11 --- Launch Strategy

Channels:

-   VSCode Marketplace
-   GitHub
-   Product Hunt
-   Reddit r/webdev
-   Twitter dev community

Content ideas:

-   "10 Tailwind mistakes this extension fixes"
-   demo videos

------------------------------------------------------------------------

# Long Term Vision

Tailwind Architect becomes:

ESLint + Prettier + Refactor engine for Tailwind CSS

Core values:

-   safe transformations
-   fast analysis
-   scalable architecture
-   developer productivity
