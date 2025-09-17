// Load environment variables
import OpenAI from "openai";
import fs from "fs";
import { z } from "zod/v4";
import { EmployeesWrapperSchema } from "./schema.js";
import dotenv from "dotenv";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

dotenv.config();

// Set file path and initialize OpenAI client
const filePath = "employee_data.pdf";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function interactiveLoop(filePath: string) {
    /*// File upload 
    const fileStream: fs.ReadStream = fs.createReadStream(filePath);

    const file = await openai.files.create({
        file: fileStream,
        purpose: "user_data",
    });

    console.log(`File uploaded: ${file.id}\n`);*/

    console.log("Ask me questions about employees (type 'exit' to quit):");

    while (true) {
        const question: string = await new Promise(res => rl.question("\n> ", res));
        if (question.trim().toLowerCase() === "exit") {
            break;
        }

        try {
            const result = await askEmployeeQuestion(question, "file-BmeFUn49T6nw7cq9E9QvmY");
            console.log("Result JSON:", JSON.stringify(result, null, 2));
        } catch (err: any) {
            console.error("Error:", err.message);
        }
    }

    rl.close();
}

async function askEmployeeQuestion(question: string, fileId: string) {
    console.log("Asking question: " + question);
    const response = await openai.responses.create({
        model: "gpt-5",
        reasoning: {
            effort: "minimal"
        },
        input: [
            {   
                role: "system",
                content: `Extract employees data according to the provided JSON schema. Return a list of employees.`
            },
            {
                role: "user",
                content: [
                    {
                        type: "input_file",
                        file_id: fileId
                    },
                    {
                        type: "input_text",
                        text: question
                    }
                ]
            }
        ],
        text: {
            format: {
                type: 'json_schema',
                name: 'structured_employee_data',
                strict: true,
                schema: z.toJSONSchema(EmployeesWrapperSchema)
            }
        }
    });

    console.log("Response: " + response.id + " " + response.status);

    if (response.status !== "completed") {
        throw new Error("LLM response incomplete: " + JSON.stringify(response.incomplete_details));
    }

    return JSON.parse(response.output_text); // already JSON, just parse it
}


await interactiveLoop(filePath);

