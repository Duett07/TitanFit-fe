"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import authApiRequest from "@/apiRequest/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearSession } from "@/lib/session";
import { queryKeys } from "./queryKeys";
import { UserResponse } from "@/types/auth.type";

import { validateUserResponse } from "@/lib/schemas";

interface UseSessionOptions {
  enabled?: boolean;
}

/**
 * Single-source-of-truth session hook powered by TanStack Query.
 * Validates backend authentication via /api/auth/me with caching, window focus refetch,
 * and automatic synchronization with Zustand's useAuthStore.
 */
export function useSession(options?: UseSessionOptions) {
  const { user: storeUser, isAuthenticated } = useAuthStore();

  const isEnabled =
    typeof window !== "undefined" &&
    (options?.enabled !== undefined ? options.enabled : isAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async (): Promise<UserResponse | null> => {
      try {
        const res = await authApiRequest.me();
        const user = res.data?.data || null;
        if (user && process.env.NODE_ENV !== "production") {
          const validation = validateUserResponse(user);
          if (!validation.success) {
            console.warn("User response schema mismatch:", validation.error.format());
          }
        }
        return user;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        // If 401 Unauthorized, token has expired or is invalid on backend
        if (axiosErr.response?.status === 401) {
          clearSession();
          return null;
        }
        throw err;
      }
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Synchronize backend response into Zustand UI store if credentials/roles changed
  useEffect(() => {
    if (query.data) {
      const beUser = query.data;
      if (
        !storeUser ||
        storeUser.id !== beUser.id ||
        storeUser.role !== beUser.role ||
        storeUser.fullName !== beUser.fullName ||
        storeUser.email !== beUser.email
      ) {
        useAuthStore.getState().setUser(beUser);
      }
    }
  }, [query.data, storeUser]);

  return {
    user: query.data ?? storeUser,
    isAuthenticated: Boolean(query.data || (isAuthenticated && !query.isError)),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
