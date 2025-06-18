import OpenAI from "openai";
import fs from "fs";
import { zodTextFormat } from "openai/helpers/zod";
import { ContractSchema } from "./schema";
import dotenv from "dotenv";

dotenv.config();

const filePath = "Vertrag_Sternenschauer_Lizenzen.pdf";
let fileStream: fs.ReadStream;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function extractContractData(filePath: string) {
    try {
        /*fileStream = fs.createReadStream(filePath);

        const file = await openai.files.create({
            file: fileStream,
            purpose: "user_data",
        });

        console.log(`File uploaded: ${file.id}`);*/

        const response = await openai.responses.parse({
            model: "gpt-4o-2024-08-06",
            input: [
                {
                    role: "system",
                    content: "Bitte extrahiere strukturierte Vertragsdaten gemäß dem vorgegebenen JSON-Schema aus dem angehängten PDF. Gib auch eine Liste aller Abschnittsüberschriften im Feld 'headlines' zurück."
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
                format: zodTextFormat(ContractSchema, "contract_data")
            }
        });

        console.log(`Response received: ${response.id} ${response.status}`);

        if (response.status !== "completed") {
            console.error("Response incomplete:", response.incomplete_details);
            return;
        }

        const parsed = response.output_parsed;
        console.log("Extracted Contract Data:\n", JSON.stringify(parsed, null, 2));
    } catch (err: any) {
        console.error("Error during extraction:", err.message);
    }
}

extractContractData(filePath);
