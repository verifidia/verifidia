import { PgVector } from "@mastra/pg";

const connectionString = process.env.DATABASE_URL!;

async function setupVectors() {
  const pgVector = new PgVector({ connectionString });

  console.log("Setting up PgVector index...");
  await pgVector.createIndex({
    indexName: "articles",
    dimension: 1536,
  });
  console.log("PgVector index 'articles' created.");
}

setupVectors().catch(console.error);
