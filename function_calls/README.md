# OpenAI Structured Outputs with Function Calling Sample

This sample demonstrates OpenAI's **Structured Outputs** feature applied to **Function Calling**, which guarantees that AI models generate function call parameters that adhere strictly to your defined JSON schemas. This ensures reliable, type-safe function invocations essential for production applications.

## What are Structured Outputs in Function Calling?

Structured Outputs with Function Calling is a capability available in OpenAI's **Responses API** (and Chat Completions API) that provides **guaranteed schema compliance** for function parameters. When `strict: true` is enabled, the model will always generate function call arguments that perfectly match your JSON schema specifications, eliminating parameter validation errors and ensuring type safety.

### Key Benefits

- **Guaranteed Parameter Compliance**: Function arguments always match your exact schema requirements
- **Type Safety**: Eliminates runtime parameter validation errors
- **Production Reliability**: Predictable function call formats for robust applications
- **Complex Schema Support**: Handle nested objects, arrays, enums, and format validations

## Running the sample

The server is written in **TypeScript** and uses the **[OpenAI Agents SDK](https://openai.github.io/openai-agents-js/)** (`@openai/agents`) with the Responses API. The SDK runs the agent loop and tool execution for you.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**  
   Create a `.env` file in the `function_calls` directory with:
   ```
   OPENAI_API_KEY=your-api-key
   ```
   Optional: set `OPENAI_MODEL` (default: `gpt-5.2`) or `PORT` (default: `5000`).

3. **Run the server**
   ```bash
   npm start
   ```
   This runs the TypeScript server with `tsx`. For production, use `npm run build` then `npm run start:prod`.

4. **Open the frontend**  
   Serve the `public` folder (e.g. with a simple HTTP server or your IDE’s live preview) and use the UI to chat and manage conference talks.

## Sample Overview

This sample uses the **[OpenAI Agents SDK](https://openai.github.io/openai-agents-js/)** for TypeScript. The SDK provides:

- **Agent loop**: Tool calls are executed automatically and results are fed back to the model until a final reply is produced (no manual `while` loop or response parsing).
- **Function tools**: Tools are defined with `tool()` and **Zod** schemas; the SDK handles schema generation, validation, and execution.

The server defines an `Agent` with instructions and three tools (`submit_talk_proposal`, `list_talks`, `delete_talks`) in `server/agentTools.ts`. Each request runs `run(agent, chat)` and returns the normalized `result.history` to the client.

This sample showcases **structured parameter validation** in a conference talk management system. It demonstrates how to:

1. Define tools with Zod schemas and `tool()` from `@openai/agents`
2. Enforce parameter compliance via the SDK’s built-in validation
3. Handle nested objects, arrays, and enum validations reliably
4. Build type-safe AI interactions with minimal boilerplate (no manual function-call loop)
