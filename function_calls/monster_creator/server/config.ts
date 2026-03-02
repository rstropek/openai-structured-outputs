import "dotenv/config";
import path from "path";

const DEFAULT_MODEL = "gpt-5-mini";
export const MODEL = process.env.MODEL ?? DEFAULT_MODEL;

/** Base path for writing bestiary markdown files (Obsidian vault) */
export const BESTIARY_PATH =
  process.env.BESTIARY_PATH;

export function getBestiaryDir(): string {
  if (!BESTIARY_PATH) {
    throw new Error("BESTIARY_PATH is not set");
  }
  return path.isAbsolute(BESTIARY_PATH)
    ? BESTIARY_PATH
    : path.resolve(process.cwd(), BESTIARY_PATH);
}

export type ReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "none";

export function getReasoningEffort(
  model: string
): ReasoningEffort | undefined {
  if (!model.startsWith("gpt-5") && !model.startsWith("o1")) return undefined;
  if (/gpt-5\.(2|3)/.test(model)) return "low";
  return "minimal";
}
