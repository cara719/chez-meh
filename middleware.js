import { NextResponse } from "next/server";
import { COOKIE, verifyToken } from "./lib/auth";

const PUBLIC = ["/login", "/api/login", "/manifest.json", "/icon-192.png", "/icon-512.png", "/favicon.ico"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  const ok = await verifyToken(req.cookies.get(COOKIE)?.value, process.env.APP_PASSPHRASE);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next/).*)"] };
