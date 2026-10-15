import { NextResponse } from "next/server";
import { COOKIE, MAX_AGE, makeToken, safeEqual } from "../../../lib/auth";

export async function POST(req) {
  const secret = process.env.APP_PASSPHRASE;
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const given = String(body.passphrase || "");
  if (!secret || !safeEqual(given, secret)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong passphrase." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await makeToken(secret), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
  return res;
}
