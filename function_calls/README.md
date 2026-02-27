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

The server is written in **TypeScript** and uses the OpenAI **Responses API** with function calling.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**  
   Create a `.env` file in the `function_calls` directory with:
   ```
   OPENAI_API_KEY=your-api-key
   ```
   Optional: set `OPENAI_MODEL` (default: `gpt-4o`) or `PORT` (default: `5000`).

3. **Run the server**
   ```bash
   npm start
   ```
   This runs the TypeScript server with `tsx`. For production, use `npm run build` then `npm run start:prod`.

4. **Open the frontend**  
   Serve the `public` folder (e.g. with a simple HTTP server or your IDE’s live preview) and use the UI to chat and manage conference talks.

## Sample Overview

This sample showcases **structured parameter validation** in a conference talk management system. It demonstrates how to:

1. Define strict JSON schemas for complex function parameters
2. Enforce parameter compliance across different data types and structures
3. Handle nested objects, arrays, and enum validations reliably
4. Build type-safe AI interactions with guaranteed schema adherence
