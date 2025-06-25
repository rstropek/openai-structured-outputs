// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import { z } from "zod/v4";
import { ContractSchema } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Set file path and initialize OpenAI client
const filePath = "Vertrag_Sternenschauer_Lizenzen.pdf";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Main function to extract contract data from PDF
async function extractContractData(filePath: string) {
    try {
        /*// File upload 
        const fileStream: fs.ReadStream = fs.createReadStream(filePath);

        const file = await openai.files.create({
            file: fileStream,
            purpose: "user_data",
        });

        console.log(`File uploaded: ${file.id}`);*/

        const response = await openai.responses.create({
            model: "gpt-4.1",
            input: [
                {
                    role: "system",
                    content: `Extract contract data according to the provided JSON schema.`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_file",
                            file_id: "file-GDs7odG8xPi3afnEDkFuNH"
                        }
                    ]
                }
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'structured_contract_data',
                    strict: true,
                    schema: z.toJSONSchema(ContractSchema)
                }
            }
        });

        // Check and handle response
        console.log(`Response received: ${response.id} ${response.status}`);
        if (response.status !== "completed") {
            console.error("Response incomplete:", response.incomplete_details);
            return;
        }

        // Output extracted contract data or handle errors
        const res = response.output[0];
        if (res.type === "message") {
            const content = res.content[0];
            if (content.type === 'refusal') {
                console.error(content.refusal);
            } else if (content.type === 'output_text') {
                console.log(`Extracted Contract Data:\n${content.text}`);
            } else {
                throw new Error("No response content");
            }
        }
    } catch (err: any) {
        // Error handling
        console.error("Error during extraction:", err.message);
    }
}

// Run extraction
await extractContractData(filePath);
