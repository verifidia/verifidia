import { createTool } from "@mastra/core/tools";
import { z } from "zod";

let exaInstance: InstanceType<typeof import("exa-js").Exa> | null = null;

async function getExa() {
  if (!exaInstance) {
    const { Exa } = await import("exa-js");
    exaInstance = new Exa(process.env.EXA_API_KEY!);
  }
  return exaInstance;
}

export const webSearchTool = createTool({
  id: "web-search",
  description: "Search the web for information about a topic",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      })
    ),
  }),
  execute: async (inputData, _context) => {
    const exa = await getExa();
    const response = await exa.searchAndContents(inputData.query, {
      numResults: 5,
      text: { maxCharacters: 1000 },
    });

    return {
      results: response.results.map((r) => ({
        title: r.title ?? "",
        url: r.url,
        snippet: r.text ?? "",
      })),
    };
  },
});
