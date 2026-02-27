import { z } from "zod";

export const ContractSchema = z.object({
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
