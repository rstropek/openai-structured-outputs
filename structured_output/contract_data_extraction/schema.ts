import { z } from "zod/v4";

export const ContractSchema = z.object({
  contract_title: z.string().meta({description: "Title or short name of the contract"}),          
  contract_date: z.iso.date().meta({description: "Date of signing"}),
  effective_date: z.iso.date().meta({description: "When the contract takes effect"}),
  duration_months: z.number().meta({description: "Duration in months"}),
  auto_renewal: z.boolean().meta({description: "Whether it renews automatically"}),
  parties: z.object({
    party_a: z.string().meta({description: "First contracting party"}),
    party_b: z.string().meta({description: "Second contracting party"}),
  }).meta({description: "Contracting parties"}),
  license_scope: z.string().meta({description: "Description of usage rights / limitations"}),
  usage_purpose: z.enum(["academic", "commercial", "internal"]).meta({description: "Purpose of the contract usage"}),
  annual_fee_eur: z.number().meta({description: "Price / licensing cost"}),
  headlines: z.array(z.string()).meta({description: "Section titles in the contract"}),
});
