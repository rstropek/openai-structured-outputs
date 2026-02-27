# CFG TCQL — Natural language to TCQL with a Lark grammar

This sample uses OpenAI's **custom tools with grammar (CFG)** to turn natural language into **valid TCQL** (Time Cockpit Query Language). The model's output is constrained by a **Lark** context-free grammar so that only grammar-valid TCQL can be generated.

## What it does

- You send a natural-language prompt (e.g. *"Select ProjectName and CustomerName from Projects where Active = True, order by ProjectName"*).
- The model is forced to call a **custom tool** whose input format is defined by the **Lark grammar** in `tcql.lark`.
- The tool’s **input** is the generated TCQL string, which must conform to the grammar (constrained decoding).

## Requirements

- **Model**: CFG/grammar custom tools are supported on **GPT-5**-series models (e.g. `gpt-5`, `gpt-5-mini`, `gpt-5.2`). Set `OPENAI_MODEL` in `.env` if needed (default: `gpt-5-mini`).
- **API key**: Set `OPENAI_API_KEY` in `.env`.

## Setup

```bash
cd cfg_tcql
npm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5-mini
```

## Run

```bash
npm start
```

Then describe what you want in natural language at the `> ` prompt (e.g. *"Select ProjectName and CustomerName from Projects where Active = True, order by ProjectName"*). Type `exit` to quit.

### If the API is slow or times out (full TCQL grammar)

The full `tcql.lark` grammar is complex and can make constrained decoding very slow. To verify that the CFG API works at all, use the minimal test grammar (matches the official SQL example):

```bash
set GRAMMAR_FILE=test_simple.lark
npm start
```

Then try a prompt like: *"Give me top 5 orders from orders where total_amount > 500 and order_date after 2025-01-01"*. The generated query will follow the simple MS SQL–style grammar in `test_simple.lark` (SELECT TOP … FROM … WHERE … ORDER BY …;). No `%ignore`, explicit `SP: " "` — as recommended in the docs.

## Files

| File        | Purpose |
|------------|--------|
| `tcql.lark` | Lark grammar for TCQL (lexer + parser rules). |
| `test_simple.lark` | Minimal MS SQL–style grammar for testing the CFG API (use with `GRAMMAR_FILE=test_simple.lark`). |
| `index.ts`  | Loads the grammar, calls the Responses API with a custom grammar tool, forces that tool via `tool_choice`, and returns the generated query from the tool’s `input`. |

## Grammar notes

- **Keywords** are case-sensitive (e.g. `From`, `In`, `Select`, `Where`).
- **Identifiers** (aliases, entities, properties) start with an uppercase letter (`UIDENT`).
- The grammar covers: `From … In … [Where …] [Order By …] Select …` (alias or `Select New With { … }`), expressions (And/Or, comparisons, `In`, `Like`, functions `:Name(...)`, aggregates, literals, nested queries, `Environment.CurrentUser.*`).
- The provided `tcql.lark` is derived from the Time Cockpit TCQL spec; you can extend or adjust it for your dialect.

## CFG vs JSON Schema

| Approach      | Use case |
|---------------|----------|
| **JSON Schema** (Structured Outputs) | Typed data: `{"field": "value"}`. |
| **CFG / Lark grammar** (custom tool) | DSLs and languages: e.g. TCQL, SQL-like syntax. |

Here we use the **custom tool with `format: { type: "grammar", syntax: "lark", definition: "..." }`** so the model can only output strings that match the TCQL grammar.

## Optional: validate with Lark

You can add a client-side check by parsing the model output with a Lark parser (e.g. `lark` in Python or a JS port) using the same `tcql.lark` to catch any remaining syntax issues.
