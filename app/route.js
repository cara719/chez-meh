import { appHtml } from "../lib/appHtml";
export const dynamic = "force-dynamic";
export function GET() {
  return new Response(appHtml, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
