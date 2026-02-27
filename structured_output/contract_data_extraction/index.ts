// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import { ContractSchema } from "./schema.js";
import dotenv from "dotenv";
import { z } from "zod/v4";

dotenv.config();

// Set file path and initialize OpenAI client
const filePath = "Vertrag_Sternenschauer_Lizenzen.pdf";
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

// Main function to extract contract data from PDF
async function extractContractData(filePath: string) {
  try {
    let fileId: string;

    if (OPENAI_FILE_ID) {
      fileId = OPENAI_FILE_ID;
      console.log(`Using existing file ID from OPENAI_FILE_ID: ${fileId}`);
    } else {
      // File upload
      const fileStream: fs.ReadStream = fs.createReadStream(filePath);
      const file = await openai.files.create({
        file: fileStream,
        purpose: "user_data",
      });
      fileId = file.id;
      console.log(`File uploaded: ${file.id}`);
    }

    const response = await openai.responses.create({
      model: MODEL,
      instructions:
        "Extract contract data according to the provided JSON schema.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: fileId,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'structured_contract_data',
          strict: true,
          schema: z.toJSONSchema(ContractSchema)
        },
      },
      ...(function () {
        const effort = getReasoningEffort(MODEL);
        return effort != null ? { reasoning: { effort } } : {};
      }()),
    });

    // Check and handle response
    console.log(`Response received: ${response.id} ${response.status}`);
    if (response.status !== "completed") {
      console.error("Response incomplete:", response.incomplete_details);
      return;
    }

    // Output extracted contract data or handle errors
    console.log(
      `Extracted Contract Data:\n${JSON.stringify(JSON.parse(response.output_text), null, 2)}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error during extraction:", message);
  }
}

// Run extraction
await extractContractData(filePath);
