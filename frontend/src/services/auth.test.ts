import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUser,
  listUsers,
  login,
  logout,
  requestPasswordReset,
  setUserActive,
  updatePassword,
  updateUserRoles,
} from "@/services/auth";
import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";
import { hasRole } from "@/types/auth";

let fake: { db: FakeDb; client: unknown; fire: (event: string) => void };

vi.mock("@/lib/supabase/client", () => ({
  // `fake` diisi di beforeEach; factory dievaluasi saat createClient dipanggil.
  createClient: () => (fake as { client: unknown }).client,
}));

function seedDb(): FakeDb {
  return {
    profiles: [
      {
        id: "user-1",
        name: "Dinda Prameswari",
        email: "dinda@pytagotech.test",
        is_active: true,
        created_at: "2026-09-01T02:00:00Z",
      },
      {
        id: "user-2",
        name: "Feby",
        email: "feby@pytagotech.test",
        is_active: true,
        created_at: "2026-09-02T02:00:00Z",
      },
      {
        id: "user-3",
        name: "Sinta",
        email: "sinta@pytagotech.test",
        is_active: false,
        created_at: "2026-09-03T02:00:00Z",
      },
    ],
    userRoles: [
      { user_id: "user-1", role_name: "Super Admin" },
      { user_id: "user-2", role_name: "Sales / Marketing" },
      { user_id: "user-3", role_name: "Sales / Marketing" },
    ],
    authUsers: [
      { id: "user-1", email: "dinda@pytagotech.test", password: "password123" },
      { id: "user-2", email: "feby@pytagotech.test", password: "password123" },
      { id: "user-3", email: "sinta@pytagotech.test", password: "password123" },
    ],
    sessionUserId: null,
    sessionExpiresAt: null,
    resetError: null,
    listeners: [],
  };
}

beforeEach(() => {
  fake = createSupabaseFake(seedDb()) as unknown as typeof fake;
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("menerima email terdaftar dengan password valid", async () => {
    const result = await login({
      email: "dinda@pytagotech.test",
      password: "password123",
    });

    expect(result.error).toBeNull();
    expect(result.data?.user.email).toBe("dinda@pytagotech.test");
    expect(result.data?.user.roles).toContain("Super Admin");
  });

  it("menolak email yang tidak terdaftar tanpa membocorkan detail", async () => {
    const result = await login({
      email: "tak-ada@pytagotech.test",
      password: "password123",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("Email atau kata sandi salah.");
  });

  it("menolak format email dan password pendek", async () => {
    expect((await login({ email: "bukan-email", password: "password123" })).error).toBe(
      "Format email tidak valid."
    );
    expect(
      (await login({ email: "dinda@pytagotech.test", password: "pendek" })).error
    ).toMatch(/minimal 8 karakter/);
  });

  it("menolak user yang dinonaktifkan", async () => {
    const result = await login({
      email: "sinta@pytagotech.test",
      password: "password123",
    });

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/dinonaktifkan/);
  });

  it("menolak login tanpa baris profil portal", async () => {
    fake.db.authUsers.push({
      id: "user-9",
      email: "tamu@pytagotech.test",
      password: "password123",
    });

    const result = await login({
      email: "tamu@pytagotech.test",
      password: "password123",
    });

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Profil portal belum tersedia/);
  });
});

describe("logout", () => {
  it("menghapus sesi aktif", async () => {
    await login({ email: "feby@pytagotech.test", password: "password123" });
    const result = await logout();

    expect(result.error).toBeNull();
    expect(fake.db.sessionUserId).toBeNull();
  });
});

describe("requestPasswordReset", () => {
  it("selalu sukses agar tidak membocorkan email terdaftar", async () => {
    const result = await requestPasswordReset("feby@pytagotech.test");

    expect(result.error).toBeNull();
    expect(result.data).toMatch(/feby@pytagotech.test/);
  });

  it("menolak format email tidak valid", async () => {
    const result = await requestPasswordReset("bukan-email");

    expect(result.data).toBeNull();
    expect(result.error).toBe("Format email tidak valid.");
  });

  it("melaporkan kegagalan pengiriman", async () => {
    fake.db.resetError = "SMTP down";

    const result = await requestPasswordReset("feby@pytagotech.test");

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Gagal mengirim/);
  });
});

describe("updatePassword", () => {
  it("memperbarui kata sandi sesi aktif", async () => {
    await login({ email: "feby@pytagotech.test", password: "password123" });

    const result = await updatePassword("kata-sandi-baru");

    expect(result.error).toBeNull();
    await logout();
    const relogin = await login({
      email: "feby@pytagotech.test",
      password: "kata-sandi-baru",
    });
    expect(relogin.error).toBeNull();
  });

  it("menolak kata sandi pendek", async () => {
    const result = await updatePassword("pendek");

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/minimal 8 karakter/);
  });
});

describe("manajemen user", () => {
  function stubCreateUser(status: number, payload: unknown) {
    vi.mocked(fetch).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    } as Response);
  }

  it("membuat user baru via Route Handler admin", async () => {
    stubCreateUser(201, {
      data: {
        id: "user-4",
        name: "Gilang",
        email: "gilang@pytagotech.test",
        roles: ["Sales / Marketing", "Executive / Leader"],
        isActive: true,
        createdAt: "2026-10-05T00:00:00Z",
      },
    });

    const result = await createUser({
      name: "Gilang",
      email: "gilang@pytagotech.test",
      roles: ["Sales / Marketing", "Executive / Leader"],
    });

    expect(result.error).toBeNull();
    expect(result.data?.roles).toHaveLength(2);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/admin/users",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("meneruskan error duplikat dan validasi lokal", async () => {
    stubCreateUser(409, { error: "Email sudah digunakan user lain." });

    expect(
      (
        await createUser({
          name: "Kembar",
          email: "FEBY@pytagotech.test",
          roles: ["Sales / Marketing"],
        })
      ).error
    ).toBe("Email sudah digunakan user lain.");

    expect(
      (await createUser({ name: "Tanpa Role", email: "x@pytagotech.test", roles: [] }))
        .error
    ).toBe("Pilih minimal satu role.");
  });

  it("mengubah role user", async () => {
    const result = await updateUserRoles("user-2", [
      "Sales / Marketing",
      "Executive / Leader",
    ]);

    expect(result.error).toBeNull();
    expect(result.data?.roles).toContain("Executive / Leader");
  });

  it("melindungi Super Admin terakhir dan akun sendiri", async () => {
    // Dinda satu-satunya Super Admin aktif di seed.
    expect((await updateUserRoles("user-1", ["Executive / Leader"])).error).toMatch(
      /Super Admin terakhir/
    );
    expect((await setUserActive("user-1", false)).error).toMatch(
      /Super Admin terakhir/
    );
    expect((await setUserActive("user-2", false, "user-2")).error).toBe(
      "Tidak dapat menonaktifkan akun sendiri."
    );
  });

  it("menonaktifkan dan mengaktifkan kembali user biasa", async () => {
    expect((await setUserActive("user-2", false, "user-1")).error).toBeNull();
    expect((await login({ email: "feby@pytagotech.test", password: "password123" })).data).toBeNull();

    const reactivated = await setUserActive("user-2", true, "user-1");
    expect(reactivated.data?.isActive).toBe(true);
  });
});

describe("hasRole", () => {
  it("true jika user punya salah satu role yang diizinkan", async () => {
    const users = await listUsers();
    const dinda = users.data?.find((user) => user.id === "user-1") ?? null;
    const feby = users.data?.find((user) => user.id === "user-2") ?? null;

    expect(hasRole(dinda, ["Super Admin"])).toBe(true);
    expect(hasRole(feby, ["Super Admin"])).toBe(false);
    expect(hasRole(null, ["Super Admin"])).toBe(false);
  });
});
