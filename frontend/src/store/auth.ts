"use client";

import { create } from "zustand";

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

/**
 * State sesi client-side (US-002).
 * Diisi dari `services/auth` agar komponen tidak menyentuh mock langsung.
 * Fase 2: `initialize` membaca sesi Supabase (middleware + Server Component).
 */
export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  error: null,

  async initialize() {
    const { data } = await getSession();
    set({ status: data ? "authenticated" : "unauthenticated", user: data?.user ?? null });
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
}));
