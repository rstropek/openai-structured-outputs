import { z } from "zod/v4";

export const ContractDataSchema = z.object({
  result_type: z.enum(["contract_data"]).describe("Discriminator: successful extraction"),
  contract_title: z.string().describe("Title or short name of the contract"),
  contract_date: z.string().describe("Date of signing (YYYY-MM-DD)"),
  effective_date: z.string().describe("When the contract takes effect (YYYY-MM-DD)"),
  duration_months: z.number().describe("Duration in months"),
  auto_renewal: z.boolean().describe("Whether it renews automatically"),
  parties: z
    .object({
      party_a: z.string().describe("First contracting party"),
      party_b: z.string().describe("Second contracting party"),
    })
    .describe("Contracting parties"),
  license_scope: z.string().describe("Description of usage rights / limitations"),
  usage_purpose: z
    .enum(["academic", "commercial", "internal"])
    .describe("Purpose of the contract usage"),
  annual_fee_eur: z.number().describe("Price / licensing cost"),
  headlines: z.array(z.string()).describe("Section titles in the contract"),
});

export const InsufficientDataSchema = z.object({
  result_type: z.enum(["insufficient_data"]).describe("Discriminator: extraction not possible"),
  reason: z.string().describe("Explanation of why the requested data could not be extracted from the document"),
});

/**
 * Envelope schema for Structured Outputs.
 * The root is a plain object with a single `result` field that uses JSON Schema anyOf.
 * This keeps the root as an object (required by Structured Outputs) while allowing multiple result shapes.
 */
export const ExtractionResultSchema = z.object({
  // Use a Zod union; z.toJSONSchema will emit an `anyOf` for this field.
  result: z.union([ContractDataSchema, InsufficientDataSchema]),
});

export type ContractData = z.infer<typeof ContractDataSchema>;
export type InsufficientData = z.infer<typeof InsufficientDataSchema>;
export type ExtractionEnvelope = z.infer<typeof ExtractionResultSchema>;
export type ExtractionResult = ExtractionEnvelope["result"];
