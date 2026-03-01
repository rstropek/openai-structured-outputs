import path from "path";
import { fileURLToPath } from "url";

// Directory of this file (cfg_tcql/src); project root is parent
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.2";
/** Path relative to project root (e.g. "docs/tcql.lark") */
export const GRAMMAR_FILE = process.env.GRAMMAR_FILE || "docs/tcql.lark";
/** Absolute path to the grammar file for loading */
export const GRAMMAR_PATH = path.join(PROJECT_ROOT, GRAMMAR_FILE);
export const TCQL_GRAMMAR_TOOL_NAME = "tcql_grammar" as const;
export const METADATA_CACHE_PATH = path.join(PROJECT_ROOT, "metadata_cache.json");
/** Directory for query result files (created on first use) */
export const RESULTS_DIR = path.join(PROJECT_ROOT, "docs", "results");

export function getReasoningEffort(
  model: string
): "minimal" | "low" | "medium" | "high" | "xhigh" | "none" | undefined {
  if (!model.startsWith("gpt-5") && !model.startsWith("o1")) return undefined;
  if (/gpt-5\.(2|3)/.test(model)) return "low";
  return "minimal";
}

export function getDirname(): string {
  return PROJECT_ROOT;
}
