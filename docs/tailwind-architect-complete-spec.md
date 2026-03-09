# Tailwind Architect --- Complete Product & Technical Architecture

Version: 1.0\
Goal: Build the most robust Tailwind productivity tool for modern
frontend ecosystems.

------------------------------------------------------------------------

# 1. Vision

Tailwind Architect is a developer productivity platform designed to:

-   improve readability of Tailwind code
-   detect conflicts and redundancy
-   safely refactor Tailwind usage
-   support modern frontend ecosystems
-   operate safely on very large repositories
-   remain compatible with Tailwind v3, v4 and future releases

The system must never break application logic and must operate using AST
transformations instead of unsafe text replacements.

------------------------------------------------------------------------

# 2. Product Scope

Tailwind Architect is composed of multiple tools sharing the same core
engine.

Components:

core engine\
CLI tool\
VSCode extension\
Cursor extension\
future ESLint plugin

All tools share the same analysis and transformation engine.

------------------------------------------------------------------------

# 3. Target Users

Primary:

Frontend developers using Tailwind CSS

Secondary:

Teams using:

Next.js\
React\
Vue\
Astro\
Svelte\
SolidJS

Tertiary:

Design systems teams maintaining large UI codebases.

------------------------------------------------------------------------

# 4. Key Product Capabilities

## 4.1 Tailwind Class Sorting

Organize utilities into semantic order.

Example:

Input

flex p-4 w-full bg-white justify-center

Output

flex justify-center w-full p-4 bg-white

Sorting groups:

layout\
alignment\
sizing\
spacing\
typography\
visual\
effects\
misc

------------------------------------------------------------------------

## 4.2 Redundancy Removal

Detect utilities overridden by other utilities.

Example:

p-4 px-4

Result

p-4

------------------------------------------------------------------------

## 4.3 Conflict Detection

Detect mutually exclusive utilities.

Example

flex grid

Conflict classification:

display conflict\
color override\
size override

------------------------------------------------------------------------

## 4.4 Optimization Suggestions

Suggest simplified expressions.

Example

pt-4 pb-4

Suggested

py-4

------------------------------------------------------------------------

## 4.5 Readability Mode

Optional formatting for large class sets.

Example

className=" flex flex-col items-center w-full max-w-xl p-6 gap-4
bg-white rounded shadow "

------------------------------------------------------------------------

## 4.6 CLI Project Analysis

Run project-wide scans.

Command

tailwind-architect analyze

Example output

240 redundant utilities\
12 conflicts\
18 optimization suggestions

------------------------------------------------------------------------

## 4.7 CI Mode

Allow CI validation.

Command

tailwind-architect lint

Exit code non-zero if issues found.

------------------------------------------------------------------------

# 5. Modern Tailwind Ecosystem Support

Classes must be detected inside modern helper functions.

Supported functions:

clsx()\
cn()\
cva()\
tw()

Libraries commonly used:

clsx\
class-variance-authority\
shadcn/ui

User configurable functions:

{ "classFunctions": \["clsx","cn","cva","tw"\] }

------------------------------------------------------------------------

# 6. Tailwind Syntax Support

## Variants

hover:\
focus:\
active:\
dark:\
md:\
lg:\
group-hover:\
peer-focus:

Example

md:hover:bg-red-500

Variant stack parsing:

variantStack → utility

------------------------------------------------------------------------

## Arbitrary Values

Examples

w-\[37px\]\
bg-\[#123456\]\
grid-cols-\[1fr_2fr\]

Parser must support arbitrary tokens.

------------------------------------------------------------------------

## Compound Variants

Example

md:hover:bg-red-500

Stack

\[md, hover\] → bg-red-500

------------------------------------------------------------------------

# 7. Code Parsing Strategy

Regex is insufficient.

AST parsing required.

Recommended libraries:

@babel/parser\
@babel/traverse\
@babel/generator

Benefits:

safe transformations\
preserve formatting\
detect nested expressions

------------------------------------------------------------------------

# 8. Class Extraction Targets

Classes may appear in:

class attribute\
className attribute\
template strings\
clsx calls\
cn calls\
arrays\
ternary expressions

Examples

clsx("flex p-4", active && "bg-red-500")

\["flex","p-4"\].join(" ")

active ? "bg-red-500" : "bg-gray-500"

------------------------------------------------------------------------

# 9. Tailwind Engine Integration

Tool must dynamically load Tailwind configuration.

Process:

Locate tailwind.config file\
Resolve configuration\
Create Tailwind context\
Resolve utilities

Benefits:

plugin compatibility\
custom theme support\
future version compatibility

------------------------------------------------------------------------

# 10. Conflict Detection Engine

Utilities resolve to CSS properties.

Example

flex → display:flex\
grid → display:grid

Conflicts detected by property overlap.

Example

bg-red-500\
bg-blue-500

Both affect background-color.

------------------------------------------------------------------------

# 11. Redundancy Detection

Utilities may override others.

Example

p-4 overrides px-4 and py-4.

Hierarchy rules:

padding-all \> padding-x\
padding-all \> padding-y

margin-all \> margin-x\
margin-all \> margin-y

------------------------------------------------------------------------

# 12. Safety Guards

Engine must skip transformations when classes are dynamic.

Example

bg-\${color}-500

These cannot be safely refactored.

------------------------------------------------------------------------

# 13. Configuration System

Configuration file

tailwind-architect.config.json

Example

{ "sortClasses": true, "removeRedundant": true, "detectConflicts": true,
"readabilityMode": false, "autoFix": true, "classFunctions":
\["clsx","cn","cva"\] }

------------------------------------------------------------------------

# 14. Feature Flags

Each feature toggleable.

sortClasses\
removeRedundant\
detectConflicts\
readabilityMode\
autoFix

------------------------------------------------------------------------

# 15. Monorepo Support

Projects may contain multiple Tailwind configs.

Example structure

apps/web\
packages/ui

Engine must resolve config per workspace.

Supported tools

turborepo\
pnpm workspaces\
yarn workspaces

------------------------------------------------------------------------

# 16. Performance Strategy

Large projects may exceed 100k files.

Strategies

file-level processing\
parallel processing\
AST reuse\
Tailwind context caching

Cache key

projectRoot + tailwindConfigHash

------------------------------------------------------------------------

# 17. CLI Architecture

Commands

tailwind-architect fix\
tailwind-architect analyze\
tailwind-architect lint

Fix

Automatically apply safe changes.

Analyze

Return statistics.

Lint

Return CI-compatible results.

------------------------------------------------------------------------

# 18. VSCode / Cursor Extension

Capabilities

Command palette actions\
Format on save\
Diagnostics warnings\
Quick fixes

Example command

Tailwind Architect: Fix Classes

------------------------------------------------------------------------

# 19. Duplicate UI Detection (Advanced Feature)

Detect repeated class patterns.

Example repeated pattern

flex items-center gap-2

Suggestion

Extract component or utility.

Example

InlineRow component

------------------------------------------------------------------------

# 20. Plugin System

Future extensibility.

Plugin API example

tailwind-architect-plugin

Capabilities

custom rules\
custom sorting groups\
custom lint rules

------------------------------------------------------------------------

# 21. Framework Compatibility

Supported frameworks

React\
Next.js\
Vue\
Astro\
Svelte\
SolidJS

Parser must detect framework-specific syntax.

------------------------------------------------------------------------

# 22. Testing Strategy

Test categories

unit tests\
integration tests\
large repository simulations\
performance benchmarks\
Tailwind version compatibility tests

------------------------------------------------------------------------

# 23. Telemetry (Optional)

Anonymous usage metrics.

Examples

feature usage frequency\
performance metrics

Must be opt-in.

------------------------------------------------------------------------

# 24. Developer Experience Goals

The tool must

reduce cognitive load\
improve Tailwind readability\
provide actionable suggestions\
avoid noisy warnings

------------------------------------------------------------------------

# 25. Roadmap

Phase 1

Core engine\
CLI\
basic extension

Phase 2

advanced conflict detection\
optimization suggestions

Phase 3

pattern detection\
component extraction suggestions

Phase 4

plugin ecosystem

------------------------------------------------------------------------

# 26. Summary

Tailwind Architect aims to become:

the ESLint of Tailwind CSS.

It focuses on

safety\
compatibility\
performance\
developer productivity

By relying on

AST transformations\
Tailwind engine integration\
configurable rules

the system can operate safely even in very large production codebases.
