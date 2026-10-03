import { beforeEach, describe, expect, it } from "vitest";

import { resetMockAuth } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

beforeEach(() => {
  resetMockAuth();
  useAuthStore.setState({ status: "loading", user: null, error: null });
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
});
