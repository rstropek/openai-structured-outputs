const express = require('express');
const cors = require('cors');
const { addTalk, getTalks, getTalk, deleteTalk, submit_talk_proposal } = require('./talks');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: "function",
    name: "submit_talk_proposal",
    description: "Ermöglicht das Einreichen eines Vortragsvorschlags für eine Entwicklerkonferenz.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "abstract",
        "speaker",
        "co_speakers",
        "category",
        "format",
        "keywords",
        "proposed_datetime"
      ],
      properties: {
        title: { type: "string" },
        abstract: { type: "string" },
        speaker: {
          type: "object",
          additionalProperties: false,
          required: ["name", "email", "experience_level"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            experience_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
          }
        },
        co_speakers: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "email"],
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" }
            }
          },
          minItems: 0,
          maxItems: 3
        },
        category: {
          type: "string",
          enum: ["AI", "Web Development", "Security", "DevOps", "UX", "Other"]
        },
        format: {
          type: "string",
          enum: ["Talk", "Workshop", "Lightning Talk"]
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 5
        },
        proposed_datetime: {
          type: "string",
          format: "date-time"
        }
      }
    },
    strict: true
  }
];

async function handleChat(chat) {
  let response;
  try {
    response = await openai.responses.create({
      model: "gpt-4.1",
      input: chat,
      tools,
    });
  } catch (err) {
    console.error("OpenAI API error:", err);
    throw err; 
  }

  const toolCall = response.output.find(item => item.type === "function_call" && item.name === "submit_talk_proposal");
  if (toolCall) {
    const args = JSON.parse(toolCall.arguments);
    let result = submit_talk_proposal({ id: Date.now().toString(), ...args }) ? "success" : "fail";
    chat.push(toolCall);
    chat.push({
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: result
    });
    const response2 = await openai.responses.create({
      model: "gpt-4.1",
      input: chat,
      tools,
      store: true,
    });
    return { chat: [...chat, { role: "assistant", content: response2.output_text }] };
  } else {
    return { chat: [...chat, { role: "assistant", content: response.output_text }] };
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { chat } = req.body;
    const result = await handleChat(chat);
    res.json(result);
  } catch (e) {
    res.status(400).send("Invalid request");
  }
});

app.get('/api/talks', (req, res) => {
  res.json(getTalks());
});

app.get('/api/talks/:id', (req, res) => {
  const talk = getTalk(req.params.id);
  if (talk) res.json(talk);
  else res.status(404).send('Not found');
});

app.delete('/api/talks/:id', (req, res) => {
  deleteTalk(req.params.id);
  res.status(204).end();
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
