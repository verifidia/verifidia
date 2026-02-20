import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  numeric,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const articleStatusEnum = pgEnum("article_status", [
  "generating",
  "completed",
  "failed",
]);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).notNull(),
    topic: varchar("topic", { length: 500 }).notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: jsonb("content").notNull(), // Array of { heading, content, citations }
    citations: jsonb("citations").notNull(), // Array of { text, url, accessed_date }
    relatedTopics: text("related_topics").array().notNull().default([]),
    modelUsed: varchar("model_used", { length: 255 }).notNull(),
    systemPromptUsed: text("system_prompt_used").notNull(),
    sourcesConsulted: jsonb("sources_consulted").notNull(), // Array of { title, url, snippet }
    confidenceScore: numeric("confidence_score", {
      precision: 4,
      scale: 3,
    }).notNull(),
    generationTimeMs: integer("generation_time_ms").notNull(),
    status: articleStatusEnum("status").notNull().default("generating"),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_topic_locale_idx").on(table.topic, table.locale),
    uniqueIndex("articles_slug_locale_idx").on(table.slug, table.locale),
  ]
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
