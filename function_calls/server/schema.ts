import { z } from "zod/v4";

/** Speaker for a talk proposal (Zod schema + inferred type) */
export const speakerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]),
});
export type Speaker = z.infer<typeof speakerSchema>;

/** Co-speaker (Zod schema + inferred type) */
export const coSpeakerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
export type CoSpeaker = z.infer<typeof coSpeakerSchema>;

/** Parameters for submit_talk_proposal tool */
export const submitTalkProposalParamsSchema = z.object({
  title: z.string(),
  abstract: z.string(),
  speaker: speakerSchema,
  co_speakers: z.array(coSpeakerSchema).min(0).max(3),
  category: z.enum([
    "AI",
    "Web Development",
    "Security",
    "DevOps",
    "UX",
    "Other",
  ]),
  format: z.enum(["Talk", "Workshop", "Lightning Talk"]),
  keywords: z.array(z.string()).min(2).max(5),
  proposed_datetime: z.string(),
});
export type SubmitTalkProposalParams = z.infer<
  typeof submitTalkProposalParamsSchema
>;

/** Parameters for delete_talks tool */
export const deleteTalksParamsSchema = z.object({
  talk_ids: z
    .array(z.string())
    .describe(
      "Array of talk IDs to be deleted. Talk IDs can be retrieved using the list_talks function."
    ),
});
export type DeleteTalksParams = z.infer<typeof deleteTalksParamsSchema>;

/** Full talk (includes id, used in app state) */
export const talkSchema = submitTalkProposalParamsSchema.extend({
  id: z.string(),
});
export type Talk = z.infer<typeof talkSchema>;
