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
        // File upload 
        const fileStream: fs.ReadStream = fs.createReadStream(filePath);

        const file = await openai.files.create({
            file: fileStream,
            purpose: "user_data",
        });

        console.log(`File uploaded: ${file.id}`);

        const response = await openai.responses.create({
            model: "gpt-5",
            reasoning: {
                effort: "minimal"
            },
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
                            file_id: file.id
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

        // Output extracted contract employee or handle errors
        
        console.log(`Extracted Contract Data:\n${JSON.stringify(JSON.parse(response.output_text), null, 2)}`);
    } catch (err: any) {
        // Error handling
        console.error("Error during extraction:", err.message);
    }
}

// Run extraction
await extractContractData(filePath);
