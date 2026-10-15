import { loginHtml } from "../../lib/loginHtml";
export const dynamic = "force-dynamic";
export function GET() {
  return new Response(loginHtml, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
