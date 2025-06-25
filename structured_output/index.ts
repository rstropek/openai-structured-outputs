import OpenAI from "openai";
import fs from "fs";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod/v4";
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

        const response = await openai.responses.create({
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
                format: {
                    type: 'json_schema',
                    name: 'structured_contract_data',
                    strict: true,
                    schema: z.toJSONSchema(ContractSchema)
                }
            }
        });

        console.log(`Response received: ${response.id} ${response.status}`);

        if (response.status !== "completed") {
            console.error("Response incomplete:", response.incomplete_details);
            return;
        }

        const res = response.output[0];
        if (res.type === "message") {
            const content = res.content[0];
            if (content.type === 'refusal') {
                console.log(content.refusal);
            } else if (content.type === 'output_text') {
                console.log("Extracted Contract Data:\n", JSON.stringify(content.text, null, 2));
            } else {
                throw new Error("No response content");
            }
        }
    } catch (err: any) {
        console.error("Error during extraction:", err.message);
    }
}

extractContractData(filePath);
