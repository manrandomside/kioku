import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// connect_timeout/idle_timeout protect serverless (Vercel) requests from
// hanging when the Supabase pooler is slow to hand out a connection.
// Without these, a single stalled connection blocks the entire request.
// max raised from default 10 → 20 because the dashboard fires ~15-17
// concurrent queries (11 top-level + nested Promise.all inside some).
const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 5,
});

export const db = drizzle(client, { schema });
