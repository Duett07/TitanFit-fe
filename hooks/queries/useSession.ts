"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { checkAndPurgeStaleSession } from "@/lib/session";

/**
 * Session hook deriving authenticated state directly from useAuthStore (localStorage).
 * Eliminates redundant /api/auth/me polling and infinite redirect loops.
 * Automatically checks and purges stale sessions when token expires.
 */
export function useSession() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAndPurgeStaleSession();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isFetching: false,
    error: null,
    refetch: async () => {
      checkAndPurgeStaleSession();
      const current = useAuthStore.getState();
      return { data: current.user, error: null };
    },
  };
}
