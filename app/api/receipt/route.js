import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "../../../lib/db";
import { IMAGE_TYPES, MAX_BASE64, buildPrompt, parseReply, summarizeDiary } from "../../../lib/receipt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.RECEIPT_MODEL || "claude-sonnet-5"; // the same model the Staggering Ledger uses
const fail = (error, status) => NextResponse.json({ error }, { status });

// Reads one receipt or order screenshot and returns what it can see. It saves nothing and keeps no copy of the image.
export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return fail("Receipt reading is not set up yet. Add ANTHROPIC_API_KEY in Vercel and redeploy.", 503);
  let body; try { body = await req.json(); } catch (e) { return fail("Invalid request.", 400); }
  const img = body && body.image, note = typeof (body && body.note) === "string" ? body.note.trim().slice(0, 300) : "";
  if (!img || !IMAGE_TYPES.includes(img.mediaType) || typeof img.data !== "string" || !img.data) return fail("Send a JPEG, PNG, GIF or WebP image.", 400);
  if (img.data.length > MAX_BASE64) return fail("That image is too large. Try a smaller photo or a screenshot.", 413);

  await ensureSchema();
  const rows = (await db().execute("SELECT cuisine_type, restaurant, dish_type FROM meals")).rows;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

  let reply;
  try {
    const res = await new Anthropic().messages.create({
      model: MODEL, max_tokens: 1500, system: buildPrompt(summarizeDiary(rows), today),
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
        { type: "text", text: note ? "Read this receipt or order. A note from the user: " + note : "Read this receipt or order." },
      ] }],
    });
    reply = (res.content.find((b) => b.type === "text") || {}).text;
  } catch (e) {
    console.error("Receipt reading failed:", e && e.status, e && e.message);
    return fail("The receipt reader is unavailable right now. Try again in a moment.", 502);
  }
  const result = parseReply(reply);
  if (!result) return fail("I couldn't make sense of that image. Try a clearer photo.", 422);
  return NextResponse.json({ ok: true, result });
}
