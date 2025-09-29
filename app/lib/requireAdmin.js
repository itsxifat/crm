// /lib/requireAdmin.js
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// IMPORTANT: make sure your authOptions exports from /lib/auth (or adjust import)
import { authOptions } from "@/lib/authOptions";

/**
 * Throws on non-admin. Use at top of Server Components / Route Handlers.
 * Returns the user object when allowed.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    // Not authenticated
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
  if (user.role !== "admin") {
    // Authenticated but not admin
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }
  return user;
}

/**
 * Helper to turn thrown errors into standard JSON responses inside Route Handlers.
 * Usage: return handleAuthError(e) in a catch block.
 */
export function handleAuthError(e) {
  const status = e?.status || 500;
  const msg = status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Server error";
  return NextResponse.json({ error: msg }, { status });
}
