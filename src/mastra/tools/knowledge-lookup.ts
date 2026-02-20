import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const knowledgeLookupTool = createTool({
  id: "knowledge-lookup",
  description: "Look up existing knowledge from the vector store",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        score: z.number(),
      })
    ),
  }),
  execute: async (_inputData, _context) => {
    return { results: [] };
  },
});
