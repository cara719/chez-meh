import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { cleanEntry } from "../../../lib/validate";

const COLS = ["entry_id", "schema_version", "occurred_at", "created_at", "created_by", "restaurant", "service_type", "item",
  "cuisine_type", "food_rating", "food_comment", "delivery_app", "delivery_rating", "delivery_comment"];

export async function GET() {
  await ensureSchema();
  const rs = await db().execute("SELECT " + COLS.join(",") + " FROM meals ORDER BY occurred_at DESC");
  return NextResponse.json({ entries: rs.rows.map((r) => Object.fromEntries(COLS.map((c) => [c, r[c] ?? null]))) });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const { entry, error } = cleanEntry(body || {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  await ensureSchema();
  await db().execute({
    sql: "INSERT OR IGNORE INTO meals (" + COLS.join(",") + ") VALUES (" + COLS.map(() => "?").join(",") + ")",
    args: COLS.map((c) => entry[c]),
  });
  // Read the row back so the client only reports success for a record that is really stored.
  const back = await db().execute({ sql: "SELECT entry_id FROM meals WHERE entry_id = ?", args: [entry.entry_id] });
  if (!back.rows.length) return NextResponse.json({ error: "Save could not be verified." }, { status: 500 });
  return NextResponse.json({ ok: true, entry });
}
