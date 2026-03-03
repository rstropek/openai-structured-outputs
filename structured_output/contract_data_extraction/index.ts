// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import { ExtractionResultSchema, type ExtractionEnvelope, type ExtractionResult } from "./schema.js";
import dotenv from "dotenv";
import { z } from "zod/v4";
import path from "path";

dotenv.config();

// Set file path from env and initialize OpenAI client
const filePath = process.env.FILE_PATH;
if (!filePath) {
  console.error("ERROR: FILE_PATH environment variable is not set. Set it to a relative path of the document to process.");
  process.exit(1);
}
const resolvedPath = path.resolve(filePath);
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
async function extractContractData(absolutePath: string) {
  try {
    let fileId: string;

    if (OPENAI_FILE_ID) {
      fileId = OPENAI_FILE_ID;
      console.log(`Using existing file ID from OPENAI_FILE_ID: ${fileId}`);
    } else {
      // File upload
      const fileStream: fs.ReadStream = fs.createReadStream(absolutePath);
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
        "Extract contract data from the uploaded document according to the provided JSON schema. If the document does not contain the requested contract information, return an insufficient_data result with a reason.",
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
          type: "json_schema",
          name: "extraction_result",
          strict: true,
          schema: z.toJSONSchema(ExtractionResultSchema),
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

    const envelope: ExtractionEnvelope = JSON.parse(response.output_text);
    const parsed: ExtractionResult = envelope.result;

    // Output extracted contract data or handle insufficient data
    if (parsed.result_type === "contract_data") {
      console.log(
        `Extracted Contract Data for ${parsed.contract_title}:\n${JSON.stringify(parsed, null, 2)}`
      );
    } else {
      console.log(
        `Insufficient data — could not extract contract information.\nReason: ${parsed.reason}`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error during extraction:", message);
  }
}

// Run extraction
await extractContractData(resolvedPath);
