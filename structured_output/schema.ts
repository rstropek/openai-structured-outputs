import { z } from "zod/v4";

export const ContractSchema = z.object({
  contract_title: z.string(),                  // Title or short name of the contract
  contract_date: z.iso.date(),                 // Date of signing (YYYY-MM-DD)
  effective_date: z.iso.date(),                // When the contract takes effect (YYYY-MM-DD)
  duration_months: z.number(),                 // Duration in months
  auto_renewal: z.boolean(),                   // Whether it renews automatically
  parties: z.object({                          // Contracting parties
    party_a: z.string(),
    party_b: z.string(),
  }),
  license_scope: z.string(),                   // Description of usage rights / limitations
  usage_purpose: z.enum(["academic", "commercial", "internal"]), // e.g., academic, commercial, internal
  annual_fee_eur: z.number(),                  // Price / licensing cost
  headlines: z.array(z.string()),              // Section titles in the contract
});
