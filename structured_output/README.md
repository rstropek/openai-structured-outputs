# OpenAI Structured Outputs Sample

This sample demonstrates OpenAI's **Structured Outputs** feature, which guarantees that AI model responses adhere to a specified JSON schema. This capability ensures reliable, predictable output formats that are essential for production applications.

## What are Structured Outputs?

Structured Outputs is a capability available in OpenAI's Chat Completions API that provides **guaranteed compliance** with your supplied JSON Schema. Unlike previous JSON mode implementations, Structured Outputs with `strict: true` offers a "foolproof" version that ensures the model will always generate responses matching your exact schema requirements.

### Key Benefits

- **Guaranteed Schema Compliance**: The model will always follow your specified structure
- **Production Reliability**: Eliminates parsing errors and unexpected response formats
- **Type Safety**: Perfect integration with TypeScript and schema validation libraries
- **Error Prevention**: Reduces the need for extensive response validation logic

## Sample Overview

This sample showcases **contract data extraction** from PDF documents using Structured Outputs. It demonstrates how to:

1. Define complex, nested data structures using Zod schemas
2. Extract structured information from unstructured documents
3. Ensure consistent output format for downstream processing
4. Handle different data types (dates, numbers, enums, arrays, objects)

## Project Structure

```
structured_output/
├── index.ts              # Main application logic
├── schema.ts             # Zod schema definitions
└── Vertrag_*.pdf        # Sample contract document
```

## Schema Definition (`schema.ts`)

The sample uses **Zod** for schema definition, which provides excellent TypeScript integration and automatic JSON Schema generation:

```typescript
export const ContractSchema = z.object({
  contract_title: z.string(),
  contract_date: z.iso.date(),
  effective_date: z.iso.date(),
  duration_months: z.number(),
  auto_renewal: z.boolean(),
  parties: z.object({
    party_a: z.string(),
    party_b: z.string(),
  }),
  license_scope: z.string(),
  usage_purpose: z.enum(["academic", "commercial", "internal"]),
  annual_fee_eur: z.number(),
  headlines: z.array(z.string()),
});
```

### Schema Features Demonstrated

- **Primitive Types**: Strings, numbers, booleans
- **Date Validation**: ISO date format enforcement
- **Nested Objects**: Complex object structures
- **Enums**: Restricted value sets for categorization
- **Arrays**: Lists of structured data
- **Metadata**: Rich descriptions for better AI understanding

## Response Handling

The sample includes comprehensive error handling for different response types:
- **Successful extraction**: Structured data output
- **Refusals**: Safety-related response rejections
- **Incomplete responses**: Handling of processing errors
