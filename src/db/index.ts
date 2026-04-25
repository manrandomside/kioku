import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// connect_timeout/idle_timeout protect serverless (Vercel) requests from
// hanging when the Supabase pooler is slow to hand out a connection.
// Without these, a single stalled connection blocks the entire request.
const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 5,
});

export const db = drizzle(client, { schema });
