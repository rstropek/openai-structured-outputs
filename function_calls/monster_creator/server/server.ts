import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Agent, run } from "@openai/agents";
import { monsterTools } from "./agentTools.js";
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
  name: "Monster Creator",
  instructions: `You are a helpful assistant that manages D&D 5e monsters in an Obsidian bestiary (Javalent Fantasy Statblocks, Basic 5e Layout). You can:
- **list_monsters**: List existing monster files (optionally in a subfolder like "Void Monster") to avoid duplicates or show the user what exists.
- **read_monster**: Read a monster file to show its content or to base a new creature on it.
- **write_monster**: Create a new monster after gathering details (name, type, CR, size, abilities, actions, flavor). Use sensible defaults when needed. Filename can include a subfolder (e.g. "Void Monster/Name.md"). Tags are auto-generated. Set "" for fields you don't know.
- **delete_monster**: Remove a monster file when the user asks; confirm the filename (e.g. from list_monsters) before deleting.
If needed ask for details in chat when needed, then use the appropriate tool.`,
  tools: monsterTools,
  model: MODEL,
  modelSettings: (() => {
    const effort = getReasoningEffort(MODEL);
    return effort != null ? { reasoning: { effort } } : {};
  })(),
});

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

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const server = app.listen(PORT, () => {
  console.log(`Monster Creator server running on http://localhost:${PORT}`);
  console.log(`Using OpenAI model: ${MODEL} (via @openai/agents)`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Server error:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Try another port (e.g. set PORT=5002 in .env).`
    );
  }
  process.exit(1);
});
