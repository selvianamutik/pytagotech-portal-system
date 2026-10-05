"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";
import { getSession, login, logout } from "@/services/auth";
import type { LoginInput, PortalUser } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: PortalUser | null;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<boolean>;
  signOut: () => Promise<void>;
}

let subscribed = false;

/** Sinkronkan store saat sesi berubah di tab lain / refresh token. */
function ensureSubscription(refresh: () => Promise<void>): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  createClient().auth.onAuthStateChange((event) => {
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED"
    ) {
      void refresh();
    }
  });
}

/**
 * State sesi client-side (US-002, FR-1).
 * Diisi dari Supabase Auth via `services/auth`; perubahan sesi
 * (tab lain, refresh token) mengalir lewat `onAuthStateChange`.
 */
export const useAuthStore = create<AuthState>()((set) => {
  async function refresh() {
    const { data } = await getSession();
    set({
      status: data ? "authenticated" : "unauthenticated",
      user: data?.user ?? null,
    });
  }

  return {
    status: "loading",
    user: null,
    error: null,

    async initialize() {
      ensureSubscription(refresh);
      await refresh();
    },

    async signIn(input) {
      set({ error: null });
      const { data, error } = await login(input);
      if (error || !data) {
        set({ status: "unauthenticated", user: null, error });
        return false;
      }
      set({ status: "authenticated", user: data.user, error: null });
      return true;
    },

    async signOut() {
      await logout();
      set({ status: "unauthenticated", user: null, error: null });
    },
  };
});
