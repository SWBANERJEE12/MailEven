import { NextRequest, NextResponse } from "next/server";

/**
 * Validates request origin to protect against Cross-Site Request Forgery (CSRF).
 * Checks Origin, Referer, and Sec-Fetch-Site headers for state-modifying HTTP requests.
 */
export function validateRequestOrigin(req: NextRequest): boolean {
  // Allow safe idempotent methods
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // Sec-Fetch-Site check (standard modern browser header)
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  // Extract candidate origin to check
  const sourceUrl = origin || referer;
  if (!sourceUrl) {
    // If neither origin nor referer is sent, ensure it's not a cross-origin browser form submission
    return true;
  }

  try {
    const sourceParsed = new URL(sourceUrl);
    const expectedHost = host?.split(":")[0] || "localhost";
    const sourceHost = sourceParsed.hostname;

    // Direct hostname match
    if (sourceHost === expectedHost) {
      return true;
    }

    // Localhost / 127.0.0.1 development match
    if (
      (sourceHost === "localhost" || sourceHost === "127.0.0.1") &&
      (expectedHost === "localhost" || expectedHost === "127.0.0.1")
    ) {
      return true;
    }

    // NextAuth URL origin match
    if (process.env.NEXTAUTH_URL) {
      const nextAuthParsed = new URL(process.env.NEXTAUTH_URL);
      if (sourceParsed.origin === nextAuthParsed.origin) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function invalidOriginResponse(): NextResponse {
  return NextResponse.json(
    { error: "Forbidden: Invalid or untrusted request origin." },
    { status: 403 }
  );
}
