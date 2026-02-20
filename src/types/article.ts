export type ArticleSection = {
  heading: string;
  content: string;
  citations: number[];
};

export type ArticleCitation = {
  text: string;
  url: string;
  accessedDate: string;
};

export type Article = {
  id: string;
  slug: string;
  topic: string;
  locale: string;
  title: string;
  summary: string;
  sections: ArticleSection[];
  citations: ArticleCitation[];
  relatedTopics: string[];
  modelUsed: string;
  systemPromptUsed: string;
  sourcesConsulted: { title: string; url: string }[];
  confidenceScore: number;
  generationTimeMs: number;
  generatedAt: Date;
  status: string;
};
