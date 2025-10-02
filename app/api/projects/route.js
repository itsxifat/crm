// Mirrors /api/projects/list so any caller using /api/projects still gets enriched rows.
import { NextResponse } from "next/server";

// tiny helper to call our list route code path
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  // forward to /api/projects/list with same query params
  const url = new URL(req.url);
  const search = url.search; // ?page=&perPage=&q=&include=...
  const forward = await fetch(`${url.origin}/api/projects/list${search}`, {
    method: "GET",
    // VERY IMPORTANT: disable caching so dev/prod always see fresh
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  const body = await forward.text();
  return new NextResponse(body, {
    status: forward.status,
    headers: { "Content-Type": "application/json" },
  });
}
