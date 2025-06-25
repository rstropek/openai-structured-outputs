// Load dependencies and environment variables
const express = require('express');
const cors = require('cors');
const { getTalks, getTalk, deleteTalk, deleteMultipleTalks, submit_talk_proposal } = require('./talks');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const { delete_talks, submit_talks, list_talks } = require('./tools');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define OpenAI tool schemas for function calling
const tools = [
  submit_talks,
  delete_talks,
  list_talks
];

// Handle chat requests and function calls
async function handleChat(chat) {

  while (true) {
    let response;
    try {
      response = await openai.responses.create({
        model: 'gpt-4.1',
        input: chat,
        instructions: 'You are a helpful assistant that can help with talk proposals for a developer conference. You can use the tools provided to you to help with the user\'s request.',
        tools,
        tool_choice: 'auto',
        store: false
      });
    } catch (err) {
      console.error('OpenAI API error:', err);
      throw err;
    }

    let functionCallHandled = false;
    for (const event of response.output) {
      if (event.type === 'function_call') {
        chat.push(event);
        let result;
        const args = JSON.parse(event.arguments);
        // console.log(`${event.call_id}: Calling ${event.name} with arguments ${event.arguments}`);
        switch (event.name) {
          case 'submit_talk_proposal':
            result = submit_talk_proposal({ id: Date.now().toString(), ...args }) ? 'success' : 'fail';
            break;
          case 'list_talks':
            result = JSON.stringify(getTalks());
            break;
          case 'delete_talks':
            const deletedCount = deleteMultipleTalks(args.talk_ids);
            result = JSON.stringify({ deleted_count: deletedCount, message: `Successfully deleted ${deletedCount} talks` });
            break;
          default:
            result = `ERROR: Unknown function: ${event.name}`;
        }
        chat.push({
          type: 'function_call_output',
          call_id: event.call_id,
          output: result
        });
        functionCallHandled = true;
      } else if (event.type === 'message') {
        chat.push({ role: 'assistant', content: event.content[0]?.text || '' });
        // If a message is returned, we are done
        return;
      }
    }
    if (!functionCallHandled) {
      // No function call in this response, break the loop
      break;
    }
  }
}

// API endpoints for chat and talks
app.post('/api/chat', async (req, res) => {
  try {
    const { chat } = req.body;
    await handleChat(chat);
    res.json(chat);
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

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
