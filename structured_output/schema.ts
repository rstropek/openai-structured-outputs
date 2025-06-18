import { z } from "zod";

export const ContractSchema = z.object({
  contract_title: z.string(),                  // Title or short name of the contract
  contract_date: z.string(),                   // Date of signing
  effective_date: z.string(),                  // When the contract takes effect
  duration_months: z.number(),                 // Duration in months
  auto_renewal: z.boolean(),                   // Whether it renews automatically
  parties: z.object({                          // Contracting parties
    party_a: z.string(),
    party_b: z.string(),
  }),
  license_scope: z.string(),                   // Description of usage rights / limitations
  usage_purpose: z.string(),                   // e.g., academic, commercial, internal
  annual_fee_eur: z.number(),                  // Price / licensing cost
  headlines: z.array(z.string()),              // Section titles in the contract
});
