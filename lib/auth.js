// Shared-passphrase login. The cookie is "<expiry>.<HMAC>", signed with the passphrase itself,
// so changing APP_PASSPHRASE signs everyone out. Works in the edge middleware and in route handlers.
export const COOKIE = "chezmeh_session";
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("chez-meh-v1:" + value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function makeToken(secret) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return exp + "." + (await sign(exp, secret));
}

export async function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(exp, secret));
}
