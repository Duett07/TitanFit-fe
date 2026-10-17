"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserResponse } from "@/types/auth.type";
import authApiRequest from "@/apiRequest/auth";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserResponse) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Clean up legacy non-HttpOnly auth cookies that may linger in user browsers
function clearLegacyAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "is_authenticated=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          set({ user: null, isAuthenticated: false, isLoading: false });

          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("user");
              clearLegacyAuthCookies();
              window.dispatchEvent(new Event("authchange"));
            } catch (err) {
              console.warn("Could not clear auth state:", err);
            }
          }
        }
      },

      checkAuth: async () => {
        // Fast optimistic hydration from localStorage if available
        if (!get().isAuthenticated && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("user");
            if (stored) {
              const parsed = JSON.parse(stored);
              set({ user: parsed, isAuthenticated: true });
            }
          } catch {
            // Ignore parse error
          }
        }

        // Validate real session with backend
        try {
          const res = await authApiRequest.me();
          if (res.data?.data) {
            get().setUser(res.data.data);
          } else {
            get().logout();
          }
        } catch {
          // Not logged in or expired session: wipe client auth state
          set({ user: null, isAuthenticated: false, isLoading: false });
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("user");
              clearLegacyAuthCookies();
              window.dispatchEvent(new Event("authchange"));
            } catch {}
          }
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
