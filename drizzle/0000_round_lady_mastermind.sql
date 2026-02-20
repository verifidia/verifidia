CREATE TYPE "public"."article_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'reviewed', 'applied', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('thumbs_up', 'thumbs_down', 'block_feedback', 'article_feedback');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"topic" varchar(500) NOT NULL,
	"locale" varchar(5) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" jsonb NOT NULL,
	"citations" jsonb NOT NULL,
	"related_topics" text[] DEFAULT '{}' NOT NULL,
	"model_used" varchar(255) NOT NULL,
	"system_prompt_used" text NOT NULL,
	"sources_consulted" jsonb NOT NULL,
	"confidence_score" numeric(4, 3) NOT NULL,
	"generation_time_ms" integer NOT NULL,
	"status" "article_status" DEFAULT 'generating' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" text,
	"feedback_type" "feedback_type" NOT NULL,
	"block_index" integer,
	"content" text,
	"status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"review_result" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"bookmarks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_topic_locale_idx" ON "articles" USING btree ("topic","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_locale_idx" ON "articles" USING btree ("slug","locale");