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

// Columns added after v1. Older tables get them added in place; old rows keep NULL ("unknown").
const ADDED = [
  ["visit_id", "TEXT"],   // groups the dishes from one order or visit
  ["rated_by", "TEXT"],   // Cara, Jason, Both or Guest
  ["rater_name", "TEXT"], // optional guest name
];

// Creates the table on first use and upgrades an older one. Safe to run every time.
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      await db().execute(`CREATE TABLE IF NOT EXISTS meals (
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
        delivery_comment TEXT,
        visit_id TEXT,
        rated_by TEXT,
        rater_name TEXT
      )`);
      const info = await db().execute("PRAGMA table_info(meals)");
      const have = new Set(info.rows.map((r) => r.name));
      for (const [col, type] of ADDED) {
        if (!have.has(col)) await db().execute(`ALTER TABLE meals ADD COLUMN ${col} ${type}`);
      }
    })().catch((e) => { ready = undefined; throw e; });
  }
  return ready;
}
