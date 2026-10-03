import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RequireRole } from "@/components/auth/require-role";
import { useAuthStore } from "@/store/auth";

const superAdmin = {
  id: "USR-001",
  name: "Dinda Prameswari",
  email: "dinda@pytagotech.test",
  roles: ["Super Admin" as const],
  isActive: true,
  createdAt: "2026-09-01T02:00:00Z",
};

const sales = {
  ...superAdmin,
  id: "USR-002",
  name: "Feby",
  email: "feby@pytagotech.test",
  roles: ["Sales / Marketing" as const],
};

beforeEach(() => {
  useAuthStore.setState({ status: "loading", user: null, error: null });
});

describe("RequireRole", () => {
  it("menampilkan status loading saat sesi diperiksa", () => {
    render(
      <RequireRole allowed={["Super Admin"]}>
        <p>konten rahasia</p>
      </RequireRole>
    );

    expect(screen.getByText("Memeriksa akses...")).toBeDefined();
  });

  it("meminta login saat belum ada sesi", () => {
    useAuthStore.setState({ status: "unauthenticated", user: null });

    render(
      <RequireRole allowed={["Super Admin"]}>
        <p>konten rahasia</p>
      </RequireRole>
    );

    expect(screen.getByText("Ke halaman masuk")).toBeDefined();
    expect(screen.queryByText("konten rahasia")).toBeNull();
  });

  it("menampilkan halaman 403 untuk role yang tidak diizinkan", () => {
    useAuthStore.setState({ status: "authenticated", user: sales });

    render(
      <RequireRole allowed={["Super Admin"]}>
        <p>konten rahasia</p>
      </RequireRole>
    );

    expect(screen.getByText("403")).toBeDefined();
    expect(screen.queryByText("konten rahasia")).toBeNull();
  });

  it("menampilkan konten untuk role yang diizinkan", () => {
    useAuthStore.setState({ status: "authenticated", user: superAdmin });

    render(
      <RequireRole allowed={["Super Admin"]}>
        <p>konten rahasia</p>
      </RequireRole>
    );

    expect(screen.getByText("konten rahasia")).toBeDefined();
  });
});
