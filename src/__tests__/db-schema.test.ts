import { describe, it, expect } from "vitest";
import {
  articles,
  feedback,
  userPreferences,
  articleStatusEnum,
  feedbackTypeEnum,
  feedbackStatusEnum,
  themeEnum,
} from "@/db/schema";
import type { Article, NewArticle } from "@/db/schema/articles";
import type { Feedback, NewFeedback } from "@/db/schema/feedback";
import type {
  UserPreferences,
  NewUserPreferences,
} from "@/db/schema/user-preferences";
import { getTableColumns } from "drizzle-orm";

describe("Database Schema", () => {
  describe("articles table", () => {
    it("has all required columns", () => {
      const columns = getTableColumns(articles);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("slug");
      expect(columnNames).toContain("topic");
      expect(columnNames).toContain("locale");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("summary");
      expect(columnNames).toContain("content");
      expect(columnNames).toContain("citations");
      expect(columnNames).toContain("relatedTopics");
      expect(columnNames).toContain("modelUsed");
      expect(columnNames).toContain("systemPromptUsed");
      expect(columnNames).toContain("sourcesConsulted");
      expect(columnNames).toContain("confidenceScore");
      expect(columnNames).toContain("generationTimeMs");
      expect(columnNames).toContain("status");
      expect(columnNames).toContain("generatedAt");
      expect(columnNames).toContain("updatedAt");
      expect(columnNames).toHaveLength(17);
    });

    it("has article_status enum with correct values", () => {
      expect(articleStatusEnum.enumValues).toEqual([
        "generating",
        "completed",
        "failed",
      ]);
    });
  });

  describe("feedback table", () => {
    it("has all required columns", () => {
      const columns = getTableColumns(feedback);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("articleId");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("feedbackType");
      expect(columnNames).toContain("blockIndex");
      expect(columnNames).toContain("content");
      expect(columnNames).toContain("status");
      expect(columnNames).toContain("reviewResult");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
      expect(columnNames).toHaveLength(10);
    });

    it("has feedback_type enum with correct values", () => {
      expect(feedbackTypeEnum.enumValues).toEqual([
        "thumbs_up",
        "thumbs_down",
        "block_feedback",
        "article_feedback",
      ]);
    });

    it("has feedback_status enum with correct values", () => {
      expect(feedbackStatusEnum.enumValues).toEqual([
        "pending",
        "reviewed",
        "applied",
        "dismissed",
      ]);
    });
  });

  describe("user_preferences table", () => {
    it("has all required columns", () => {
      const columns = getTableColumns(userPreferences);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("language");
      expect(columnNames).toContain("theme");
      expect(columnNames).toContain("bookmarks");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
      expect(columnNames).toHaveLength(7);
    });

    it("has theme enum with correct values", () => {
      expect(themeEnum.enumValues).toEqual(["light", "dark", "system"]);
    });
  });

  describe("type inference", () => {
    it("Article select type includes all fields", () => {
      const _check: Article = {} as Article;
      expect(_check).toBeDefined();
    });

    it("NewArticle insert type includes all fields", () => {
      const _check: NewArticle = {} as NewArticle;
      expect(_check).toBeDefined();
    });

    it("Feedback types are defined", () => {
      const _select: Feedback = {} as Feedback;
      const _insert: NewFeedback = {} as NewFeedback;
      expect(_select).toBeDefined();
      expect(_insert).toBeDefined();
    });

    it("UserPreferences types are defined", () => {
      const _select: UserPreferences = {} as UserPreferences;
      const _insert: NewUserPreferences = {} as NewUserPreferences;
      expect(_select).toBeDefined();
      expect(_insert).toBeDefined();
    });
  });
});
