import OpenAI from "openai";
import {
  MODEL,
  TCQL_GRAMMAR_TOOL_NAME,
  getReasoningEffort,
  GRAMMAR_PATH
} from "./config.js";
import fs from "fs";

export async function generateTcqlQuery(
  naturalPrompt: string,
  instructions: string,
  openai: OpenAI
): Promise<string> {
  const grammar = fs.readFileSync(GRAMMAR_PATH, "utf-8");;

  const response = await openai.responses.create({
    model: MODEL,
    instructions,
    input: naturalPrompt.trim(),
    text: { format: { type: "text" } },
    tools: [
      {
        type: "custom",
        name: TCQL_GRAMMAR_TOOL_NAME,
        description:
          "Use this tool to output a valid TCQL query. The output must conform exactly to the TCQL grammar (Lark). Output only the TCQL query, no explanation or extra text.",
        format: {
          type: "grammar",
          syntax: "lark",
          definition: grammar,
        },
      },
    ],
    tool_choice: { type: "custom", name: TCQL_GRAMMAR_TOOL_NAME },
    parallel_tool_calls: false,
    ...(function () {
      const effort = getReasoningEffort(MODEL);
      return effort != null ? { reasoning: { effort } } : {};
    }()),
  });

  const customCall = response.output.find(
    (item) =>
      item.type === "custom_tool_call" &&
      item.name === TCQL_GRAMMAR_TOOL_NAME &&
      typeof (item as { input?: unknown }).input === "string"
  ) as { type: "custom_tool_call"; name: string; input: string } | undefined;

  if (!customCall) {
    throw new Error(
      "No TCQL output in response. Output may be incomplete or the model did not use the grammar tool."
    );
  }

  return customCall.input.trim();
}
