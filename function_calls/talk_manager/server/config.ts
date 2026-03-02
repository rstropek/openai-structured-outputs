import "dotenv/config";

const DEFAULT_MODEL = "gpt-5.2";
export const MODEL = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

export type ReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "none";

/**
 * Map model name to reasoning effort for gpt-5 / o1 models.
 * Only these models support the reasoning parameter; others get undefined.
 */
export function getReasoningEffort(
  model: string
): ReasoningEffort | undefined {
  if (!model.startsWith("gpt-5") && !model.startsWith("o1")) return undefined;
  if (/gpt-5\.(2|3)/.test(model)) return "low";
  return "minimal";
}
