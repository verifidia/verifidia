import { Mastra } from "@mastra/core";
import { PgVector } from "@mastra/pg";
import { researchAgent, writerAgent, citationAgent } from "./agents";
import { articleGenerationWorkflow } from "./workflows/article-generation";
import { feedbackReviewerAgent } from "./agents/feedback-reviewer";
import { feedbackReviewWorkflow } from "./workflows/feedback-review";

const connectionString = process.env.DATABASE_URL!;

export const mastra = new Mastra({
  agents: {
    researchAgent,
    writerAgent,
    citationAgent,
    feedbackReviewerAgent,
  },
  workflows: {
    articleGenerationWorkflow,
    feedbackReviewWorkflow,
  },
  vectors: {
    pgVector: new PgVector({ connectionString }),
  },
});

export { researchAgent, writerAgent, citationAgent };
export { articleGenerationWorkflow };
export { feedbackReviewerAgent };
export { feedbackReviewWorkflow };
