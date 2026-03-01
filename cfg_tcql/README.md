# CFG TCQL — Natural language to TCQL with a Lark grammar

This sample uses OpenAI's **custom tools with grammar (CFG)** to turn natural language into **valid TCQL** (Time Cockpit Query Language). The model's output is constrained by a **Lark** context-free grammar so that only grammar-valid TCQL can be generated.

## What it does

- You send a natural-language prompt (e.g. *"Select ProjectName and CustomerName from Projects where Active = True, order by ProjectName"*).
- The model is forced to call a **custom tool** whose input format is defined by the **Lark grammar** in `docs/tcql.lark`.
- The tool’s **input** is the generated TCQL string, which must conform to the grammar (constrained decoding).
- **Optional (Time Cockpit API):** If `TIMECOCKPIT_API_KEY` is set, metadata is fetched from the Time Cockpit API (or cache), included in the system prompt, and each generated TCQL query is executed against the API; the result is printed before the next prompt.

## Requirements

- **Model**: CFG/grammar custom tools are supported on **GPT-5**-series models (e.g. `gpt-5`, `gpt-5-mini`, `gpt-5.2`). Set `OPENAI_MODEL` in `.env` if needed (default: `gpt-5-mini`).
- **API key**: Set `OPENAI_API_KEY` in `.env`.
- **Optional**: Set `TIMECOCKPIT_API_KEY` (Time Cockpit Personal Access Token) to load metadata and run queries.

## Setup

```bash
cd cfg_tcql
npm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5-mini
# Optional: Time Cockpit token for metadata + query execution
# TIMECOCKPIT_API_KEY=your-time-cockpit-token
```

## Run

```bash
npm start
```

Then describe what you want in natural language at the `> ` prompt. If `TIMECOCKPIT_API_KEY` is set, you’ll see the generated TCQL and the API result; otherwise only the TCQL is printed. Type `exit` to quit.

## Files

| File | Purpose |
|------|--------|
| `src/index.ts` | Entry point: loads env, fetches metadata (if TC key set), builds instructions, runs interactive loop; prints TCQL and (optionally) Time Cockpit result. |
| `src/config.ts` | Model, grammar path, reasoning effort, constants. |
| `src/grammar.ts` | Loads the Lark grammar from disk. |
| `src/timecockpit.ts` | Time Cockpit API: fetch/cache metadata (OData `$metadata`), format for prompt, execute TCQL via `/select`. |
| `src/prompt.ts` | Builds system instructions (base TCQL rules + optional metadata text). |
| `src/generate.ts` | Calls OpenAI Responses API with grammar tool; returns generated TCQL string. |
| `docs/tcql.lark` | Lark grammar for TCQL. |
| `metadata_cache.json` | Created when `TIMECOCKPIT_API_KEY` is set; cache of `$metadata` (set `FORCE_METADATA=1` to refresh). |

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
