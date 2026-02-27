import express from "express";
import cors from "cors";
import {
  getTalks,
  getTalk,
  deleteTalk,
  deleteMultipleTalks,
  submit_talk_proposal,
  type Talk,
} from "./talks.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import type {
  ResponseInput,
  ResponseOutputMessage,
  ResponseOutputText,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses.js";
import { tools as toolDefs } from "./tools.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn(
    "OPENAI_API_KEY is not set. Set it in .env to use the chat API."
  );
}
const openai = new OpenAI({ apiKey: apiKey ?? "" });

const DEFAULT_MODEL = "gpt-5-mini";
const MODEL = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

function getMessageText(msg: ResponseOutputMessage): string {
  const part = msg.content?.find(
    (p): p is ResponseOutputText => p.type === "output_text"
  );
  return part?.text ?? "";
}

async function handleChat(chat: ResponseInput): Promise<void> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  while (true) {
    let response;
    try {
      response = await openai.responses.create({
        model: MODEL,
        input: chat,
        instructions:
          "You are a helpful assistant that can help with talk proposals for a developer conference. You can use the tools provided to you to help with the user's request.",
        tools: toolDefs,
        tool_choice: "auto",
        store: false,
        ...(MODEL.startsWith("gpt-5") || MODEL.startsWith("o1")
          ? { reasoning: { effort: "minimal" as const } }
          : {}),
      });
    } catch (err) {
      console.error("OpenAI API error:", err);
      throw err;
    }

    let functionCallHandled = false;
    for (const event of response.output) {
      if (event.type === "function_call") {
        const fc = event as ResponseFunctionToolCall;
        chat.push(fc);
        let result: string;
        const args = JSON.parse(fc.arguments) as Record<string, unknown>;
        switch (fc.name) {
          case "submit_talk_proposal":
            result = submit_talk_proposal({
              id: Date.now().toString(),
              ...args,
            } as Talk)
              ? "success"
              : "fail";
            break;
          case "list_talks":
            result = JSON.stringify(getTalks());
            break;
          case "delete_talks":
            const deletedCount = deleteMultipleTalks(
              (args.talk_ids as string[]) ?? []
            );
            result = JSON.stringify({
              deleted_count: deletedCount,
              message: `Successfully deleted ${deletedCount} talks`,
            });
            break;
          default:
            result = `ERROR: Unknown function: ${fc.name}`;
        }
        chat.push({
          type: "function_call_output",
          call_id: fc.call_id,
          output: result,
        });
        functionCallHandled = true;
      } else if (event.type === "message") {
        const text = getMessageText(event as ResponseOutputMessage);
        chat.push({ role: "assistant", content: text });
        return;
      }
    }
    if (!functionCallHandled) {
      break;
    }
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { chat } = req.body as { chat: ResponseInput };
    if (!Array.isArray(chat)) {
      res.status(400).send("Invalid request: chat must be an array");
      return;
    }
    await handleChat(chat);
    res.json(chat);
  } catch (e) {
    console.error(e);
    res.status(400).send("Invalid request");
  }
});

app.get("/api/talks", (_req, res) => {
  res.json(getTalks());
});

app.get("/api/talks/:id", (req, res) => {
  const talk = getTalk(req.params.id);
  if (talk) res.json(talk);
  else res.status(404).send("Not found");
});

app.delete("/api/talks/:id", (req, res) => {
  deleteTalk(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const server = app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`Using OpenAI model: ${MODEL}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Server error:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Try another port (e.g. set PORT=5001 in .env).`
    );
  }
  process.exit(1);
});
