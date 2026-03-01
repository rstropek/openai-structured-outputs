import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import readline from "readline";
import OpenAI from "openai";
import { GRAMMAR_FILE, MODEL, getDirname, RESULTS_DIR } from "./config.js";
import { buildInstructions } from "./prompt.js";
import { generateTcqlQuery } from "./generate.js";
import {
  getMetadata,
  formatMetadataForPrompt,
  executeQuery,
} from "./timecockpit.js";

dotenv.config({ path: path.join(getDirname(), ".env") });

process.on("unhandledRejection", (reason, promise) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const cause = reason instanceof Error && reason.cause ? String((reason as Error).cause) : "";
  console.error("Unhandled rejection:", msg, cause || "");
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Set OPENAI_API_KEY in .env");
    process.exit(1);
  }

  const tcToken = process.env.TIMECOCKPIT_API_KEY;
  let instructions: string;
  let canExecute = false;

  if (tcToken) {
    console.log("Loading Time Cockpit metadata…");
    try {
      const metadata = await getMetadata(tcToken, process.env.FORCE_METADATA === "1");
      const metadataText = formatMetadataForPrompt(metadata);
      instructions = buildInstructions(metadataText);
      canExecute = true;
      console.log("Metadata loaded.\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
      console.error("Metadata load failed:", msg, cause || "");
      console.error("Continuing without metadata (no query execution).\n");
      instructions = buildInstructions();
    }
  } else {
    instructions = buildInstructions();
    console.log("No TIMECOCKPIT_API_KEY: TCQL only (no metadata, no query execution).\n");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (GRAMMAR_FILE !== "docs/tcql.lark") console.log("Grammar file:", GRAMMAR_FILE);
  console.log("Model:", MODEL);
  console.log("");
  console.log(
    "Describe what you want in natural language; I'll generate TCQL and run it (type 'exit' to quit):"
  );

  while (true) {
    const question: string = await new Promise((res) => rl.question("\n> ", res));
    if (question.trim().toLowerCase() === "exit") break;
    if (!question.trim()) continue;

    try {
      const tcql = await generateTcqlQuery(question, instructions, openai);
      console.log("TCQL:");
      console.log(tcql);

      if (canExecute && tcToken) {
        const result = await executeQuery(tcToken, tcql);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `result-${timestamp}.json`;
        if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
        const resultPath = path.join(RESULTS_DIR, filename);
        let toWrite: string;
        try {
          const parsed = JSON.parse(result);
          toWrite = JSON.stringify(parsed, null, 2);
        } catch {
          toWrite = result;
        }
        fs.writeFileSync(resultPath, toWrite, "utf-8");
        console.log("Result saved to", path.relative(getDirname(), resultPath));
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      let message = e.message;
      const cause = e.cause instanceof Error ? e.cause : null;
      if (cause) {
        const c = cause as Error & { code?: string };
        if (c.code === "ECONNRESET" || message === "terminated") {
          message = `Network error (connection reset). Try again. ${c.message || ""}`.trim();
        } else {
          message += ` (${cause.message})`;
        }
      }
      console.error("Error:", message);
    }
  }

  rl.close();
}

main();
