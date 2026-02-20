import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { articles } from "./articles";

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "thumbs_up",
  "thumbs_down",
  "block_feedback",
  "article_feedback",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "pending",
  "reviewed",
  "applied",
  "dismissed",
]);

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  userId: text("user_id"), // nullable — anonymous feedback allowed
  feedbackType: feedbackTypeEnum("feedback_type").notNull(),
  blockIndex: integer("block_index"), // nullable — for block-level feedback
  content: text("content"),
  status: feedbackStatusEnum("status").notNull().default("pending"),
  reviewResult: text("review_result"), // AI reviewer's output
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
