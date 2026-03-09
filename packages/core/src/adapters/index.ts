import type { ClassStringSpan, SourceAdapter } from "../types.js";
import { extractAstroClassSpans } from "./astro.js";
import { extractSvelteClassSpans } from "./svelte.js";
import { extractVueClassSpans } from "./vue.js";

const ADAPTERS: Record<string, SourceAdapter> = {
  ".vue": extractVueClassSpans,
  ".astro": extractAstroClassSpans,
  ".svelte": extractSvelteClassSpans
};

export function getAdapterForExtension(ext: string): SourceAdapter | null {
  return ADAPTERS[ext] ?? null;
}

export type { ClassStringSpan };
