import { createClient } from "@libsql/client";

let client;
let ready;

export function db() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

// Creates the table on first use. Safe to run every time.
export function ensureSchema() {
  if (!ready) {
    ready = db().execute(`CREATE TABLE IF NOT EXISTS meals (
      entry_id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL DEFAULT 1,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT,
      restaurant TEXT NOT NULL,
      service_type TEXT NOT NULL CHECK (service_type IN ('dine_in','delivery')),
      item TEXT NOT NULL,
      cuisine_type TEXT NOT NULL,
      food_rating INTEGER NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
      food_comment TEXT NOT NULL DEFAULT '',
      delivery_app TEXT,
      delivery_rating INTEGER CHECK (delivery_rating IS NULL OR delivery_rating BETWEEN 1 AND 5),
      delivery_comment TEXT
    )`).catch((e) => { ready = undefined; throw e; });
  }
  return ready;
}
