"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserResponse } from "@/types/auth.type";
import authApiRequest from "@/apiRequest/auth";
import {
  clearSession,
  registerAuthReset,
  clearLegacyAuthCookies,
  checkAndPurgeStaleSession,
} from "@/lib/session";
import { emitSyncEvent } from "@/lib/sync";

export { clearSession, clearLegacyAuthCookies, checkAndPurgeStaleSession };

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserResponse) => void;
  updateUser: (partial: Partial<UserResponse>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: UserResponse) => {
        set({ user, isAuthenticated: true, isLoading: false });

        if (typeof window !== "undefined") {
          try {
            // Remove legacy forgeable cookies
            clearLegacyAuthCookies();
            window.dispatchEvent(new Event("authchange"));
            emitSyncEvent("AUTH_CHANGED", { userId: user.id });
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("Could not dispatch auth change event:", err);
            }
          }
        }
      },

      updateUser: (partial: Partial<UserResponse>) => {
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...partial };
          if (typeof window !== "undefined") {
            try {
              window.dispatchEvent(new Event("authchange"));
              emitSyncEvent("AUTH_CHANGED", { userId: updated.id });
            } catch (err) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("Could not dispatch auth change event:", err);
              }
            }
          }
          return { user: updated };
        });
      },

      logout: async () => {
        try {
          await authApiRequest.logout();
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Backend logout failed or offline:", err);
          }
        } finally {
          clearSession();
        }
      },
    }),
    {
      name: "titanfit_auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        checkAndPurgeStaleSession();
      },
    }
  )
);

// Register store reset hook with session manager
registerAuthReset(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});
