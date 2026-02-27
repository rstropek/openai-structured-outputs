import type { FunctionTool } from "openai/resources/responses/responses.js";

const submit_talks: FunctionTool = {
  type: "function",
  name: "submit_talk_proposal",
  description:
    "Enables submitting a talk proposal for a developer conference.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "abstract",
      "speaker",
      "co_speakers",
      "category",
      "format",
      "keywords",
      "proposed_datetime",
    ],
    properties: {
      title: { type: "string" },
      abstract: { type: "string" },
      speaker: {
        type: "object",
        additionalProperties: false,
        required: ["name", "email", "experience_level"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          experience_level: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
        },
      },
      co_speakers: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "email"],
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
        minItems: 0,
        maxItems: 3,
      },
      category: {
        type: "string",
        enum: ["AI", "Web Development", "Security", "DevOps", "UX", "Other"],
      },
      format: {
        type: "string",
        enum: ["Talk", "Workshop", "Lightning Talk"],
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 5,
      },
      proposed_datetime: {
        type: "string",
        format: "date-time",
      },
    },
  },
  strict: true,
};

const list_talks: FunctionTool = {
  type: "function",
  name: "list_talks",
  description: "Lists all available talks including their IDs and values.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  strict: true,
};

const delete_talks: FunctionTool = {
  type: "function",
  name: "delete_talks",
  description: "Deletes multiple talks by their IDs.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["talk_ids"],
    properties: {
      talk_ids: {
        type: "array",
        items: { type: "string" },
        description:
          "Array of talk IDs to be deleted. Talk IDs can be retrieved using the list_talks function.",
      },
    },
  },
  strict: true,
};

export const tools: FunctionTool[] = [submit_talks, list_talks, delete_talks];

export { submit_talks, list_talks, delete_talks };
