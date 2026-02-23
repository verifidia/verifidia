import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '#/env'
// biome-ignore lint/performance/noNamespaceImport: drizzle requires namespace import for schema inference
import * as schema from './schema.ts'
export const db = drizzle(env.DATABASE_URL, { schema })
