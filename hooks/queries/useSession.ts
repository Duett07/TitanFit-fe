"use client";

import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Session hook deriving authenticated state directly from useAuthStore (localStorage).
 * Eliminates redundant /api/auth/me polling and infinite redirect loops.
 */
export function useSession() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    isFetching: false,
    error: null,
    refetch: async () => ({ data: user, error: null }),
  };
}
