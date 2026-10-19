/**
 * Centralized session manager for clearing client auth state, storage, and cookies.
 */

import { emitSyncEvent } from "@/lib/sync";

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
