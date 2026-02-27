// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import { z } from "zod/v4";
import { EmployeesWrapperSchema } from "./schema.js";
import dotenv from "dotenv";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

dotenv.config();

// Set file path and initialize OpenAI client
const filePath = "employee_data.pdf";
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

/** When set, use this file ID instead of uploading (e.g. for quick testing without re-upload). */
const OPENAI_FILE_ID = process.env.OPENAI_FILE_ID;

async function interactiveLoop(filePath: string) {
  let fileId: string;

  if (OPENAI_FILE_ID) {
    fileId = OPENAI_FILE_ID;
    console.log(`Using existing file ID from OPENAI_FILE_ID: ${fileId}\n`);
  } else {
    // File upload
    const fileStream: fs.ReadStream = fs.createReadStream(filePath);
    const file = await openai.files.create({
      file: fileStream,
      purpose: "user_data",
    });
    fileId = file.id;
    console.log(`File uploaded: ${fileId}\n`);
  }

  console.log("Ask me questions about employees (type 'exit' to quit):");

  while (true) {
    const question: string = await new Promise((res) => rl.question("\n> ", res));
    if (question.trim().toLowerCase() === "exit") {
      break;
    }

    try {
      const result = await askEmployeeQuestion(question, fileId);
      console.log("Result JSON:", JSON.stringify(result, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error:", message);
    }
  }

  rl.close();
}

async function askEmployeeQuestion(question: string, fileId: string) {
  console.log("Asking question: " + question);
  const response = await openai.responses.create({
    model: MODEL,
    instructions:
      "Answer the user's question about the employee data in the document. " +
      "Return only the employee(s) that match the question in the 'employees' array. " +
      "Examples: for 'employee with the longest last name' return only that one employee; " +
      "for 'all in Vienna' return only employees in Vienna; for 'list everyone' return all. " +
      "Do not return the full list unless the question asks for it.",
    input: [
      {
        role: "user",
        content: [
          { type: "input_file", file_id: fileId },
          { type: "input_text", text: question },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "structured_employee_data",
        strict: true,
        schema: z.toJSONSchema(EmployeesWrapperSchema),
      },
    },
    ...(function () {
      const effort = getReasoningEffort(MODEL);
      return effort != null ? { reasoning: { effort } } : {};
    }()),
  });

  console.log("Response: " + response.id + " " + response.status);

  if (response.status !== "completed") {
    throw new Error(
      "LLM response incomplete: " +
        JSON.stringify(response.incomplete_details)
    );
  }

  return JSON.parse(response.output_text);
}

await interactiveLoop(filePath);

