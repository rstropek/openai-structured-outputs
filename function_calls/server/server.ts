import express from "express";
import cors from "cors";
import { getTalk, getTalks, deleteTalk } from "./talks.js";
import dotenv from "dotenv";
import { Agent, run } from "@openai/agents";
import { talkTools } from "./agentTools.js";
import type { AgentInputItem } from "@openai/agents";
import { MODEL, getReasoningEffort } from "./config.js";

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

const agent = new Agent({
  name: "Conference Assistant",
  instructions:
    "You are a helpful assistant that can help with talk proposals for a developer conference. You can use the tools provided to you to help with the user's request.",
  tools: talkTools,
  model: MODEL,
  modelSettings: (() => {
    const effort = getReasoningEffort(MODEL);
    return effort != null ? { reasoning: { effort } } : {};
  })(),
});

/**
 * Normalize SDK history for the frontend: only user and assistant messages with
 * content as string (for display). Drops reasoning, function_call, and
 * function_call_output so the client never sends them back; the API rejects
 * re-sending those without exact pairing.
 */
function normalizeHistoryForClient(history: AgentInputItem[]): unknown[] {
  return history
    .filter((item) => {
      const o = item as Record<string, unknown>;
      return o.role === "user" || o.role === "assistant";
    })
    .map((item) => {
      const o = item as Record<string, unknown>;
      if (o.role === "assistant" && Array.isArray(o.content)) {
        const text = (o.content as Array<{ type?: string; text?: string }>)
          .filter((p) => p.type === "output_text" && typeof p.text === "string")
          .map((p) => p.text!)
          .join("");
        return { role: "assistant", content: text };
      }
      if (o.role === "user" && Array.isArray(o.content)) {
        const text = (o.content as Array<{ type?: string; text?: string }>)
          .filter((p) => p.type === "input_text" && typeof p.text === "string")
          .map((p) => p.text!)
          .join("");
        return text ? { role: "user", content: text } : null;
      }
      if (o.role === "user" && typeof o.content === "string") {
        return { role: "user", content: o.content };
      }
      return item;
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

/**
 * Convert client chat format back to SDK/Responses API format. Only include
 * user and assistant messages so we never re-send reasoning/function_call/
 * function_call_output (the API requires reasoning+function_call to stay
 * paired). Assistant content (string) is converted to the array format the
 * SDK expects.
 */
function chatFromClientToSdkInput(chat: unknown[]): AgentInputItem[] {
  return chat
    .filter((item) => {
      const o = item as Record<string, unknown>;
      return o.role === "user" || o.role === "assistant";
    })
    .map((item) => {
      const o = item as Record<string, unknown>;
      if (o.role === "assistant" && typeof o.content === "string") {
        return {
          role: "assistant",
          status: "completed" as const,
          content: [{ type: "output_text" as const, text: o.content }],
        };
      }
      if (o.role === "user" && typeof o.content === "string") {
        return {
          role: "user",
          content: [{ type: "input_text" as const, text: o.content }],
        };
      }
      return item as AgentInputItem;
    });
}

app.post("/api/chat", async (req, res) => {
  try {
    const { chat } = req.body as { chat: unknown };
    if (!Array.isArray(chat)) {
      res.status(400).send("Invalid request: chat must be an array");
      return;
    }
    if (!apiKey) {
      res.status(500).send("OPENAI_API_KEY is not set");
      return;
    }

    const result = await run(agent, chatFromClientToSdkInput(chat));
    const history = normalizeHistoryForClient(result.history);
    res.json(history);
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
  console.log(`Using OpenAI model: ${MODEL} (via @openai/agents)`);
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
