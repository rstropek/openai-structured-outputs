// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-5.2";
const MODEL = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

/** Reasoning effort: gpt-5.2+ don't support "minimal" (only none/low/medium/high/xhigh). Older gpt-5, gpt-5-mini, gpt-5.1, o1 support "minimal". */
function getReasoningEffort(
  model: string
): "minimal" | "low" | "medium" | "high" | "xhigh" | "none" | undefined {
  if (!model.startsWith("gpt-5") && !model.startsWith("o1")) return undefined;
  if (/gpt-5\.(2|3)/.test(model)) return "low";
  return "minimal";
}

const TCQL_GRAMMAR_TOOL_NAME = "tcql_grammar";

const GRAMMAR_FILE = process.env.GRAMMAR_FILE || "tcql.lark";
const USE_SIMPLE_GRAMMAR = GRAMMAR_FILE === "test_simple.lark";

function loadGrammar(): string {
  const grammarPath = path.join(__dirname, GRAMMAR_FILE);
  return fs.readFileSync(grammarPath, "utf-8");
}

async function interactiveLoop() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Set OPENAI_API_KEY in .env");
    process.exit(1);
  }

  if (GRAMMAR_FILE !== "tcql.lark") {
    console.log("Grammar file:", GRAMMAR_FILE);
  }
  console.log("Model:", MODEL);
  console.log("");
  console.log(
    USE_SIMPLE_GRAMMAR
      ? "Using test_simple.lark — try: 'Give me top 5 orders from orders where total_amount > 500 and order_date after 2025-01-01'"
      : "Describe what you want in natural language; I'll generate TCQL (type 'exit' to quit):"
  );

  while (true) {
    const question: string = await new Promise((res) => rl.question("\n> ", res));
    if (question.trim().toLowerCase() === "exit") {
      break;
    }
    if (!question.trim()) continue;

    try {
      const tcql = await generateTcqlQuery(question);
      console.log("TCQL:");
      console.log(tcql);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error:", message);
    }
  }

  rl.close();
}

async function generateTcqlQuery(naturalPrompt: string): Promise<string> {
  const grammar = loadGrammar();

  const instructions = USE_SIMPLE_GRAMMAR
    ? "You are an MS SQL expert. Use the tcql_grammar tool to output a single SELECT TOP query. " +
      "The query must have: SELECT TOP <number> <columns> FROM <table> WHERE total_amount > <number> AND order_date > '<yyyy-mm-dd>' ORDER BY order_date DESC; " +
      "Use the grammar tool to output the query. Output nothing else."
    : "You are a TCQL (Time Cockpit Query Language) expert. " +
      "Generate only a valid TCQL query that matches the user's request. " +
      "For conditions on aggregated values from a subquery: use ( From ... Select New With { .X = Sum(...) } ) > value, not Sum( ( From ... ) ). " +
      "Use the tcql_grammar tool to output the query. Output nothing else.";

  const response = await openai.responses.create({
    model: MODEL,
    instructions,
    input: naturalPrompt.trim(),
    text: { format: { type: "text" } },
    tools: [
      {
        type: "custom",
        name: TCQL_GRAMMAR_TOOL_NAME,
        description: USE_SIMPLE_GRAMMAR
          ? "Output a read-only MS SQL Server Query. YOU MUST REASON ABOUT THE QUERY AND MAKE SURE IT OBEYS THE GRAMMAR."
          : "Use this tool to output a valid TCQL query. The output must conform exactly to the TCQL grammar (Lark). Output only the TCQL query, no explanation or extra text.",
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

await interactiveLoop();
