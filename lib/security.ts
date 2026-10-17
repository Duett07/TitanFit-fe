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
