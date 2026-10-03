import { beforeEach, describe, expect, it } from "vitest";

import {
  createUser,
  listUsers,
  login,
  logout,
  requestPasswordReset,
  resetMockAuth,
  setUserActive,
  updateUserRoles,
} from "@/services/auth";
import { hasRole } from "@/types/auth";

beforeEach(() => {
  resetMockAuth();
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
});

describe("logout", () => {
  it("menghapus sesi aktif", async () => {
    await login({ email: "feby@pytagotech.test", password: "password123" });
    const result = await logout();

    expect(result.error).toBeNull();
  });
});

describe("requestPasswordReset", () => {
  it("mengembalikan pesan sukses untuk email terdaftar", async () => {
    const result = await requestPasswordReset("feby@pytagotech.test");

    expect(result.error).toBeNull();
    expect(result.data).toMatch(/feby@pytagotech.test/);
  });

  it("menolak email yang tidak terdaftar", async () => {
    const result = await requestPasswordReset("tak-ada@pytagotech.test");

    expect(result.data).toBeNull();
    expect(result.error).toBe("Email tidak terdaftar di portal.");
  });
});

describe("manajemen user", () => {
  it("membuat user baru dengan banyak role", async () => {
    const result = await createUser({
      name: "Figo",
      email: "figo@pytagotech.test",
      roles: ["Sales / Marketing", "Executive / Leader"],
    });

    expect(result.error).toBeNull();
    expect(result.data?.roles).toHaveLength(2);

    const list = await listUsers();
    expect(list.data).toHaveLength(6);
  });

  it("menolak email duplikat dan role kosong", async () => {
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
    const result = await updateUserRoles("USR-002", [
      "Sales / Marketing",
      "Executive / Leader",
    ]);

    expect(result.error).toBeNull();
    expect(result.data?.roles).toContain("Executive / Leader");
  });

  it("melindungi Super Admin terakhir dan akun sendiri", async () => {
    // Dinda satu-satunya Super Admin aktif di data mock.
    expect((await updateUserRoles("USR-001", ["Executive / Leader"])).error).toMatch(
      /Super Admin terakhir/
    );
    expect((await setUserActive("USR-001", false)).error).toMatch(
      /Super Admin terakhir/
    );
    expect((await setUserActive("USR-002", false, "USR-002")).error).toBe(
      "Tidak dapat menonaktifkan akun sendiri."
    );
  });

  it("menonaktifkan dan mengaktifkan kembali user biasa", async () => {
    expect((await setUserActive("USR-002", false, "USR-001")).error).toBeNull();
    expect((await login({ email: "feby@pytagotech.test", password: "password123" })).data).toBeNull();

    const reactivated = await setUserActive("USR-002", true, "USR-001");
    expect(reactivated.data?.isActive).toBe(true);
  });
});

describe("hasRole", () => {
  it("true jika user punya salah satu role yang diizinkan", async () => {
    const users = await listUsers();
    const dinda = users.data?.find((user) => user.id === "USR-001") ?? null;
    const feby = users.data?.find((user) => user.id === "USR-002") ?? null;

    expect(hasRole(dinda, ["Super Admin"])).toBe(true);
    expect(hasRole(feby, ["Super Admin"])).toBe(false);
    expect(hasRole(null, ["Super Admin"])).toBe(false);
  });
});
