// /lib/absoluteUrl.js
import { headers } from "next/headers";

/**
 * Build an absolute URL for server-side fetch.
 * On the client, just return the path (browser resolves it).
 */
export async function absoluteUrl(path = "/") {
  if (typeof window !== "undefined") return path; // client-side

  const h = await headers(); // Next 15: dynamic APIs are async
  const proto =
    h.get("x-forwarded-proto") ||
    (process.env.VERCEL ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  const base = `${proto}://${host}`;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
