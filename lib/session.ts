/**
 * Centralized session manager for clearing client auth state, storage, and cookies.
 */

import { emitSyncEvent } from "@/lib/sync";
import { isJwtExpired } from "@/lib/security";

type ResetHandler = () => void;
let resetHandler: ResetHandler | null = null;

/**
 * Register a hook to reset the Zustand auth store without introducing circular dependencies.
 */
export function registerAuthReset(handler: ResetHandler) {
  resetHandler = handler;
}

/**
 * Remove legacy non-HttpOnly client cookies that may linger in user browsers.
 */
export function clearLegacyAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "is_authenticated=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "titanfit_clear_session=; path=/; max-age=0; SameSite=Lax";
}

/**
 * Completely wipes all authentication state from memory, storage, and cookies.
 */
export function clearSession() {
  // 1. Reset in-memory Zustand store
  if (resetHandler) {
    resetHandler();
  }

  // 2. Clear browser storage and cookies
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("titanfit_auth");
      clearLegacyAuthCookies();
      window.dispatchEvent(new Event("authchange"));
      emitSyncEvent("AUTH_CHANGED");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Could not clear session storage:", err);
      }
    }
  }
}

/**
 * Checks for server-issued eviction signals or expired JWT tokens in storage,
 * and clears the session if stale.
 * Returns true if the session was purged; false if valid or unauthenticated.
 */
export function checkAndPurgeStaleSession(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Check for server-initiated clear flag (e.g. from proxy.ts redirect)
  if (document.cookie.includes("titanfit_clear_session=1")) {
    clearSession();
    return true;
  }

  // 2. Check if auth in localStorage has an expired token
  try {
    const raw = localStorage.getItem("titanfit_auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const user = parsed?.state?.user;
      const token = user?.accessToken || localStorage.getItem("accessToken");
      if (token && isJwtExpired(token)) {
        clearSession();
        return true;
      }
    }
  } catch {
    clearSession();
    return true;
  }

  return false;
}
