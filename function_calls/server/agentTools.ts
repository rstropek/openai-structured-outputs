import { tool } from "@openai/agents";
import { z } from "zod";
import {
  getTalks,
  deleteMultipleTalks,
  submit_talk_proposal,
} from "./talks.js";
import {
  submitTalkProposalParamsSchema,
  deleteTalksParamsSchema,
} from "./schema.js";

export const submitTalkProposalTool = tool({
  name: "submit_talk_proposal",
  description:
    "Enables submitting a talk proposal for a developer conference.",
  parameters: submitTalkProposalParamsSchema,
  async execute(args) {
    const talk = {
      id: Date.now().toString(),
      ...args,
    };
    return submit_talk_proposal(talk) ? "success" : "fail";
  },
});

export const listTalksTool = tool({
  name: "list_talks",
  description: "Lists all available talks including their IDs and values.",
  parameters: z.object({}),
  async execute() {
    return JSON.stringify(getTalks());
  },
});

export const deleteTalksTool = tool({
  name: "delete_talks",
  description: "Deletes multiple talks by their IDs.",
  parameters: deleteTalksParamsSchema,
  async execute({ talk_ids }) {
    const deletedCount = deleteMultipleTalks(talk_ids);
    return JSON.stringify({
      deleted_count: deletedCount,
      message: `Successfully deleted ${deletedCount} talks`,
    });
  },
});

export const talkTools = [
  submitTalkProposalTool,
  listTalksTool,
  deleteTalksTool,
];
