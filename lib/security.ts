/**
 * Security utilities for input validation, sanitization, and defensive guards.
 */

/**
 * Validates and sanitizes a redirect target to prevent Open Redirect vulnerabilities.
 *
 * Requirements:
 * 1. Must be a relative path starting with a single '/'
 * 2. Must not start with '//' (protocol-relative URL) or '/\'
 * 3. Must not contain backslashes ('\') anywhere (prevents browser path-normalization bypasses)
 * 4. Must not contain external schemes (e.g. http:, https:, javascript:, data:)
 *
 * @param url Candidate URL or path from query parameter
 * @param fallback Safe default destination (defaults to "/")
 * @returns Sanitized relative internal path or fallback
 */
export function getSafeRedirect(url: string | null | undefined, fallback = "/"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();

  // Basic sanity check: must start with '/' and not '//' or '/\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject backslashes anywhere in the target string
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Ensure parsing with localhost base produces an exact origin match with no protocol hijacking
  try {
    const parsed = new URL(trimmed, "http://localhost");
    // If the origin changed or protocol is not http (e.g. javascript:, data:), reject
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    // Return relative pathname + search + hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Safely parses a JWT payload and determines if the token has expired.
 * Returns true only if the token contains a valid numeric 'exp' claim that is in the past.
 *
 * @param token Candidate JWT token string
 * @returns true if exp is present and expired; false otherwise
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp || typeof parsed.exp !== "number") return false;
    return parsed.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

