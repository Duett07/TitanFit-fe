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

// Cookie helper
function setClientAuthCookies(user: UserResponse) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `is_authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_name=${encodeURIComponent(user.fullName)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearClientAuthCookies() {
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
            setClientAuthCookies(user);
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
              clearClientAuthCookies();
              window.dispatchEvent(new Event("authchange"));
            } catch (err) {
              console.warn("Could not clear auth state:", err);
            }
          }
        }
      },

      checkAuth: async () => {
        // If already logged in, optionally revalidate with /api/auth/me
        if (!get().isAuthenticated && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("user");
            if (stored) {
              const parsed = JSON.parse(stored);
              set({ user: parsed, isAuthenticated: true });
              setClientAuthCookies(parsed);
              return;
            }
          } catch {
            // Ignore parse error
          }
        }

        try {
          const res = await authApiRequest.me();
          if (res.data?.data) {
            get().setUser(res.data.data);
          }
        } catch {
          // Not logged in or expired session
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
