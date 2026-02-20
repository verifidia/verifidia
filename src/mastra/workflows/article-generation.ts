import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { isBlockedTopic } from "@/lib/safety";
import { researchAgent } from "../agents/research-agent";
import { writerAgent, WRITER_INSTRUCTIONS } from "../agents/writer-agent";
import { citationAgent } from "../agents/citation-agent";
import { db } from "@/db";
import { articles } from "@/db/schema";

const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});

const sectionSchema = z.object({
  heading: z.string(),
  content: z.string(),
  citations: z.array(z.number()),
});

const citationSchema = z.object({
  text: z.string(),
  url: z.string(),
  accessedDate: z.string(),
});

const safetyCheckStep = createStep({
  id: "safety-check",
  inputSchema: z.object({ topic: z.string(), locale: z.string() }),
  outputSchema: z.object({ topic: z.string(), locale: z.string(), safetyPassed: z.boolean() }),
  execute: async ({ inputData }) => {
    const { blocked, reason } = isBlockedTopic(inputData.topic);
    if (blocked) {
      throw new Error(`Topic blocked: ${reason}`);
    }

    return {
      topic: inputData.topic,
      locale: inputData.locale,
      safetyPassed: true,
    };
  },
});

const researchStep = createStep({
  id: "research",
  inputSchema: z.object({ topic: z.string(), locale: z.string(), safetyPassed: z.boolean() }),
  outputSchema: z.object({ topic: z.string(), locale: z.string(), sources: z.array(sourceSchema) }),
  execute: async ({ inputData }) => {
    const result = await researchAgent.generate(
      `Research the topic: "${inputData.topic}". Find authoritative sources and key facts.`
    );

    let sources: Array<{ title: string; url: string; snippet: string }> = [];
    try {
      const parsed = JSON.parse(result.text) as { sources?: unknown };
      const sourceParse = z.array(sourceSchema).safeParse(parsed.sources ?? []);
      sources = sourceParse.success ? sourceParse.data : [];
    } catch {
      sources = [];
    }

    return { topic: inputData.topic, locale: inputData.locale, sources };
  },
});

const generateArticleStep = createStep({
  id: "generate-article",
  inputSchema: z.object({ topic: z.string(), locale: z.string(), sources: z.array(sourceSchema) }),
  outputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
  }),
  execute: async ({ inputData }) => {
    const sourceSummary = inputData.sources
      .map((source, index) => `[${index}] ${source.title}: ${source.snippet}`)
      .join("\n");
    const prompt = `Write a Wikipedia-style article about "${inputData.topic}" in locale "${inputData.locale}".\n\nSources:\n${sourceSummary}\n\nReturn valid JSON only.`;
    const result = await writerAgent.generate(prompt);

    const fallbackArticle = {
      title: inputData.topic,
      summary: "",
      sections: [] as Array<{ heading: string; content: string; citations: number[] }>,
      relatedTopics: [] as string[],
    };

    let article = fallbackArticle;
    try {
      const parsed = JSON.parse(result.text);
      const articleParse = z
        .object({
          title: z.string(),
          summary: z.string(),
          sections: z.array(sectionSchema),
          relatedTopics: z.array(z.string()),
        })
        .safeParse(parsed);
      article = articleParse.success ? articleParse.data : fallbackArticle;
    } catch {
      article = fallbackArticle;
    }

    return {
      topic: inputData.topic,
      locale: inputData.locale,
      sources: inputData.sources,
      article,
    };
  },
});

const extractCitationsStep = createStep({
  id: "extract-citations",
  inputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
  }),
  outputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
    citations: z.array(citationSchema),
  }),
  execute: async ({ inputData }) => {
    const sourcesText = inputData.sources
      .map((source, index) => `[${index}] ${source.title} - ${source.url}`)
      .join("\n");
    const result = await citationAgent.generate(
      `Format these sources as citations:\n${sourcesText}\n\nReturn JSON array only.`
    );

    let citations: Array<{ text: string; url: string; accessedDate: string }> = [];
    try {
      const parsed = JSON.parse(result.text);
      const citationParse = z.array(citationSchema).safeParse(parsed);
      citations = citationParse.success
        ? citationParse.data
        : inputData.sources.map((source) => ({
            text: source.title,
            url: source.url,
            accessedDate: new Date().toISOString().split("T")[0]!,
          }));
    } catch {
      citations = inputData.sources.map((source) => ({
        text: source.title,
        url: source.url,
        accessedDate: new Date().toISOString().split("T")[0]!,
      }));
    }

    return { ...inputData, citations };
  },
});

const scoreConfidenceStep = createStep({
  id: "score-confidence",
  inputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
    citations: z.array(citationSchema),
  }),
  outputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
    citations: z.array(citationSchema),
    confidenceScore: z.number(),
  }),
  execute: async ({ inputData }) => {
    const score = Math.min(
      1,
      inputData.sources.length * 0.15 + inputData.citations.length * 0.1 + 0.4
    );
    return { ...inputData, confidenceScore: score };
  },
});

const persistArticleStep = createStep({
  id: "persist-article",
  inputSchema: z.object({
    topic: z.string(),
    locale: z.string(),
    sources: z.array(sourceSchema),
    article: z.object({
      title: z.string(),
      summary: z.string(),
      sections: z.array(sectionSchema),
      relatedTopics: z.array(z.string()),
    }),
    citations: z.array(citationSchema),
    confidenceScore: z.number(),
  }),
  outputSchema: z.object({ slug: z.string(), title: z.string(), confidenceScore: z.number() }),
  execute: async ({ inputData }) => {
    const startTime = Date.now();
    const slug = inputData.topic
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db
      .insert(articles)
      .values({
        slug,
        topic: inputData.topic,
        locale: inputData.locale,
        title: inputData.article.title,
        summary: inputData.article.summary,
        content: inputData.article.sections,
        citations: inputData.citations,
        relatedTopics: inputData.article.relatedTopics,
        modelUsed: "anthropic/claude-3-5-haiku-20241022",
        systemPromptUsed: WRITER_INSTRUCTIONS,
        sourcesConsulted: inputData.sources,
        confidenceScore: String(inputData.confidenceScore),
        generationTimeMs: Date.now() - startTime,
        status: "completed",
      })
      .onConflictDoNothing();

    return {
      slug,
      title: inputData.article.title,
      confidenceScore: inputData.confidenceScore,
    };
  },
});

export const articleGenerationWorkflow = createWorkflow({
  id: "article-generation",
  inputSchema: z.object({ topic: z.string(), locale: z.string() }),
  outputSchema: z.object({ slug: z.string(), title: z.string(), confidenceScore: z.number() }),
})
  .then(safetyCheckStep)
  .then(researchStep)
  .then(generateArticleStep)
  .then(extractCitationsStep)
  .then(scoreConfidenceStep)
  .then(persistArticleStep)
  .commit();
