import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";

let fake: { db: FakeDb; client: unknown; fire: (event: string) => void };
let useAuthStore: typeof import("@/store/auth").useAuthStore;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => (fake as { client: unknown }).client,
}));

beforeEach(async () => {
  vi.resetModules();
  fake = createSupabaseFake({
    profiles: [
      {
        id: "user-4",
        name: "Raka",
        email: "raka@pytagotech.test",
        is_active: true,
        created_at: "2026-09-04T02:00:00Z",
      },
    ],
    userRoles: [{ user_id: "user-4", role_name: "Project Manager" }],
    authUsers: [{ id: "user-4", email: "raka@pytagotech.test", password: "password123" }],
    sessionUserId: null,
    sessionExpiresAt: null,
    resetError: null,
    listeners: [],
  }) as unknown as typeof fake;
  ({ useAuthStore } = await import("@/store/auth"));
});

describe("useAuthStore", () => {
  it("initialize tanpa sesi menjadi unauthenticated", async () => {
    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("signIn sukses mengisi user dan status", async () => {
    const ok = await useAuthStore
      .getState()
      .signIn({ email: "raka@pytagotech.test", password: "password123" });

    expect(ok).toBe(true);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.name).toBe("Raka");
  });

  it("signIn gagal menyimpan pesan error", async () => {
    const ok = await useAuthStore
      .getState()
      .signIn({ email: "tak-ada@pytagotech.test", password: "password123" });

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe("Email atau kata sandi salah.");
  });

  it("signOut membersihkan sesi", async () => {
    await useAuthStore
      .getState()
      .signIn({ email: "raka@pytagotech.test", password: "password123" });
    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("mengikuti perubahan sesi dari onAuthStateChange", async () => {
    await useAuthStore.getState().initialize();
    await useAuthStore
      .getState()
      .signIn({ email: "raka@pytagotech.test", password: "password123" });
    expect(useAuthStore.getState().status).toBe("authenticated");

    fake.db.sessionUserId = null;
    fake.fire("SIGNED_OUT");
    await vi.waitFor(() => {
      expect(useAuthStore.getState().status).toBe("unauthenticated");
    });
  });
});
