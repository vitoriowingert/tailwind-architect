# Tailwind Architect --- Core Engine Algorithms Specification

This document defines the core algorithms that power Tailwind Architect.

Focus areas: - parsing Tailwind classes - variant handling - semantic
sorting - redundancy detection - conflict detection - Tailwind utility
resolution - caching strategy - performance architecture

------------------------------------------------------------------------

# 1. Engine Pipeline

source file ↓ AST parse ↓ class extraction ↓ tokenization ↓ variant
parsing ↓ utility resolution ↓ conflict detection ↓ redundancy detection
↓ optimization suggestions ↓ sorting ↓ rewrite AST ↓ generate code

Each stage should be modular and independently testable.

------------------------------------------------------------------------

# 2. AST Parsing

Regex must never be used for production transformations.

Recommended libraries:

-   @babel/parser
-   @babel/traverse
-   @babel/generator

Parser configuration:

plugins: - typescript - jsx - decorators

------------------------------------------------------------------------

# 3. Class Extraction Algorithm

Classes can appear in multiple syntaxes.

Supported patterns:

class="..." className="..." clsx("...") cn("...") cva("...") tw("...")

AST targets:

-   JSXAttribute
-   CallExpression
-   TemplateLiteral
-   ConditionalExpression
-   ArrayExpression

Output structure:

ClassNode { location rawString classes\[\] variantStack\[\] }

------------------------------------------------------------------------

# 4. Tokenization

Input example:

flex items-center gap-2 bg-white p-4

Algorithm:

tokens = input.split(/`\s`{=tex}+/)

Result:

\["flex","items-center","gap-2","bg-white","p-4"\]

------------------------------------------------------------------------

# 5. Variant Parsing

Example:

md:hover:bg-red-500

Steps:

1.  Split by ":"
2.  Last segment = utility
3.  Remaining segments = variants

Result:

variants = \["md","hover"\] utility = "bg-red-500"

Conflicts must only be evaluated inside the same variant stack.

------------------------------------------------------------------------

# 6. Tailwind Utility Resolution

Goal: map utility → CSS properties.

Examples:

flex → display bg-red-500 → background-color w-full → width

Resolution flow:

utility ↓ Tailwind engine ↓ CSS properties

Libraries:

-   tailwindcss
-   tailwind-merge

------------------------------------------------------------------------

# 7. Conflict Detection Algorithm

Conflict occurs when two utilities affect the same CSS property.

Example:

flex grid

Both modify:

display

Algorithm:

for each utility: resolve CSS properties

for each property: if property already mapped: record conflict

Conflict types:

-   override
-   redundancy
-   impossible combination

------------------------------------------------------------------------

# 8. Redundancy Detection

Example:

p-4 px-4

Hierarchy:

padding-all \> padding-x padding-all \> padding-y

Algorithm:

if parent utility exists: remove child utilities

Examples:

p-4 px-4 → p-4 flex flex-row → flex

------------------------------------------------------------------------

# 9. Optimization Suggestions

Example:

pt-4 pb-4

Suggested:

py-4

Mapping table:

pt + pb → py pl + pr → px

------------------------------------------------------------------------

# 10. Semantic Sorting

Recommended order:

layout alignment sizing spacing typography visual effects misc

Example:

Input: p-4 flex bg-white justify-center w-full

Output: flex justify-center w-full p-4 bg-white

------------------------------------------------------------------------

# 11. Arbitrary Values

Examples:

w-\[37px\] bg-\[#123456\] grid-cols-\[1fr_2fr\]

Rule:

utility\[value\]

Parser must treat these as valid utilities.

------------------------------------------------------------------------

# 12. Safety Guards

Never transform dynamic classes.

Examples:

bg-${color}-500
`text-${size}\`

Detection:

TemplateLiteral with expressions

Rule:

skip transformation

------------------------------------------------------------------------

# 13. Tailwind Context Cache

Cache key:

projectRoot + tailwindConfigHash

Tailwind context should be reused across file scans.

------------------------------------------------------------------------

# 14. Project Scanner

Architecture:

scan files batch files process concurrently aggregate results

Concurrency:

maxWorkers = cpuCount

------------------------------------------------------------------------

# 15. AST Rewrite Strategy

Steps:

1.  locate class node
2.  replace class string
3.  regenerate code

Never rewrite the entire file.

------------------------------------------------------------------------

# 16. Performance Strategy

Target repository size:

10k+ files

Optimizations:

-   AST cache
-   worker threads
-   Tailwind context cache
-   lazy rule evaluation

------------------------------------------------------------------------

# 17. Testing Strategy

Unit tests:

-   sorting
-   conflict detection
-   redundancy detection
-   variant parsing

Integration tests:

-   JSX files
-   Next.js components
-   shadcn UI components

------------------------------------------------------------------------

# 18. Future Engine Enhancements

Potential features:

-   CSS property graph
-   Tailwind plugin resolution
-   design system enforcement
-   UI pattern detection

Example:

detect repeated patterns

flex items-center gap-2

Suggest:

extract component

------------------------------------------------------------------------

# Final Vision

Tailwind Architect engine becomes:

The static analysis engine for Tailwind CSS.

Providing:

-   safe transformations
-   intelligent suggestions
-   scalable performance
