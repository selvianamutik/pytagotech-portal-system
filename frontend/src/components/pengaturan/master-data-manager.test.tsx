import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MasterDataManager } from "@/components/pengaturan/master-data-manager";
import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";

let fake: { db: FakeDb; client: unknown };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => (fake as { client: unknown }).client,
}));

beforeEach(() => {
  fake = createSupabaseFake({
    masterOptions: [
      { category: "industry", value: "Teknologi", is_active: true },
      { category: "industry", value: "Retail", is_active: false },
      { category: "priority", value: "High", is_active: true },
    ],
    teamMembers: [
      {
        id: "tm-1",
        profile_id: null,
        name: "Nabila",
        status: "internal",
        is_active: true,
        created_at: "2026-10-01T02:00:00Z",
        updated_at: "2026-10-01T02:00:00Z",
      },
      {
        id: "tm-2",
        profile_id: null,
        name: "Bimo",
        status: "external",
        is_active: false,
        created_at: "2026-10-01T03:00:00Z",
        updated_at: "2026-10-01T03:00:00Z",
      },
    ],
  }) as unknown as typeof fake;
});

describe("MasterDataManager", () => {
  it("menampilkan 9 kelompok dan opsi beserta status aktif", async () => {
    render(<MasterDataManager />);

    expect(await screen.findByText("Master Data")).toBeDefined();
    expect(screen.getByRole("button", { name: /Kategori industri/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Status lead/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Tim \/ PIC/ })).toBeDefined();

    expect(await screen.findByText("Teknologi")).toBeDefined();
    expect(screen.getByText("Retail")).toBeDefined();
    expect(screen.getAllByText("Aktif").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Nonaktif")).toBeDefined();
  });

  it("menambah opsi baru dan langsung tampil di tabel", async () => {
    render(<MasterDataManager />);
    expect(await screen.findByText("Teknologi")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Tambah opsi" }));
    fireEvent.change(screen.getByLabelText("Nilai opsi"), {
      target: { value: "Energi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Energi")).toBeDefined();
    expect(
      fake.db.masterOptions?.some(
        (row) => row.category === "industry" && row.value === "Energi"
      )
    ).toBe(true);
  });

  it("menampilkan tim/PIC dari tabel dan bisa berpindah kelompok", async () => {
    render(<MasterDataManager />);
    expect(await screen.findByText("Teknologi")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Tim \/ PIC/ }));

    expect(await screen.findByText("Nabila")).toBeDefined();
    expect(screen.getByText("Internal")).toBeDefined();
    expect(screen.getByRole("button", { name: "Tambah tim/PIC" })).toBeDefined();
  });

  it("menampilkan status aktif tim/PIC dan bisa mengaktifkannya kembali", async () => {
    render(<MasterDataManager />);
    expect(await screen.findByText("Teknologi")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Tim \/ PIC/ }));

    expect(await screen.findByText("Bimo")).toBeDefined();
    expect(screen.getByText("Nonaktif")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Aktifkan" }));

    expect(
      await screen.findByText('Tim/PIC "Bimo" diaktifkan.')
    ).toBeDefined();
    expect(
      fake.db.teamMembers?.find((member) => member.id === "tm-2")?.is_active
    ).toBe(true);
  });
});
