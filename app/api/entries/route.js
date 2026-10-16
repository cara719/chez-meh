import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { cleanEntry } from "../../../lib/validate";

const COLS = ["entry_id", "schema_version", "occurred_at", "created_at", "created_by", "visit_id", "rated_by", "rater_name", "restaurant", "service_type", "item",
  "cuisine_type", "food_rating", "food_comment", "delivery_app", "delivery_rating", "delivery_comment", "updated_at"];

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

// Edit one dish. Dish fields change on that row; visit fields (restaurant, cuisine, when, how, delivery details)
// change on every dish that shares its visit_id, so the dishes from one order stay consistent.
export async function PUT(req) {
  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  body = body || {};
  await ensureSchema();
  const id = typeof body.entry_id === "string" ? body.entry_id.trim() : "";
  const found = await db().execute({ sql: "SELECT entry_id, visit_id, rated_by FROM meals WHERE entry_id = ?", args: [id] });
  const ex = found.rows[0];
  if (!ex) return NextResponse.json({ error: "That entry no longer exists." }, { status: 404 });
  body.visit_id = ex.visit_id || ex.entry_id;
  const { entry: e, error } = cleanEntry(body, { legacy: ex.rated_by == null });
  if (error) return NextResponse.json({ error }, { status: 400 });
  const now = new Date().toISOString();
  const visitSet = "occurred_at = ?, restaurant = ?, service_type = ?, cuisine_type = ?, delivery_app = ?, delivery_rating = ?, delivery_comment = ?, updated_at = ?";
  const visitArgs = [e.occurred_at, e.restaurant, e.service_type, e.cuisine_type, e.delivery_app, e.delivery_rating, e.delivery_comment, now];
  await db().batch([
    { sql: "UPDATE meals SET rated_by = ?, rater_name = ?, item = ?, food_rating = ?, food_comment = ?, updated_at = ? WHERE entry_id = ?",
      args: [e.rated_by, e.rater_name, e.item, e.food_rating, e.food_comment, now, id] },
    ex.visit_id
      ? { sql: "UPDATE meals SET " + visitSet + " WHERE visit_id = ?", args: [...visitArgs, ex.visit_id] }
      : { sql: "UPDATE meals SET " + visitSet + " WHERE entry_id = ?", args: [...visitArgs, id] },
  ], "write");
  return NextResponse.json({ ok: true });
}

// Delete one dish. Deleting something already gone counts as success.
export async function DELETE(req) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return NextResponse.json({ error: "Bad entry id." }, { status: 400 });
  await ensureSchema();
  await db().execute({ sql: "DELETE FROM meals WHERE entry_id = ?", args: [id] });
  const back = await db().execute({ sql: "SELECT entry_id FROM meals WHERE entry_id = ?", args: [id] });
  if (back.rows.length) return NextResponse.json({ error: "Delete could not be verified." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
