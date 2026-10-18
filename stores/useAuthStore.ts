"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserResponse } from "@/types/auth.type";
import authApiRequest from "@/apiRequest/auth";
import { clearSession, registerAuthReset, clearLegacyAuthCookies } from "@/lib/session";

export { clearSession, clearLegacyAuthCookies };

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserResponse) => void;
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
            localStorage.setItem("user", JSON.stringify(user));
            // Remove legacy forgeable cookies
            clearLegacyAuthCookies();
            window.dispatchEvent(new Event("authchange"));
          } catch (err) {
            console.warn("Could not save user to localStorage:", err);
          }
        }
      },

      logout: async () => {
        try {
          await authApiRequest.logout();
        } catch (err) {
          console.warn("Backend logout failed or offline:", err);
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
    }
  )
);

// Register store reset hook with session manager
registerAuthReset(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});
