import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMasterOption,
  createTeamMember,
  deleteMasterOption,
  deleteTeamMember,
  getActiveMasterOptions,
  listAllMasterOptions,
  listTeamMembers,
  setMasterOptionActive,
  updateMasterOption,
  updateTeamMember,
} from "@/services/master-data";
import { listLeadPICs } from "@/services/leads";
import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";

let fake: { db: FakeDb; client: unknown };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => (fake as { client: unknown }).client,
}));

function seedDb(): FakeDb {
  return {
    profiles: [],
    userRoles: [],
    authUsers: [],
    sessionUserId: null,
    sessionExpiresAt: null,
    resetError: null,
    listeners: [],
    masterOptions: [
      { category: "industry", value: "Teknologi", is_active: true },
      { category: "industry", value: "Retail", is_active: false },
      { category: "lead_status", value: "New", is_active: true },
      { category: "brand", value: "Pytagotech", is_active: true },
      { category: "priority", value: "High", is_active: true },
    ],
    teamMembers: [
      {
        id: "tm-1",
        profile_id: null,
        name: "Nabila",
        status: "internal",
        created_at: "2026-10-01T02:00:00Z",
        updated_at: "2026-10-01T02:00:00Z",
      },
    ],
  };
}

beforeEach(() => {
  fake = createSupabaseFake(seedDb());
});

describe("master options", () => {
  it("membaca opsi aktif saja dan seluruh opsi untuk admin", async () => {
    const active = await listAllMasterOptions();
    expect(active.error).toBeNull();
    expect(active.data).toHaveLength(5);

    const publicOnly = await getActiveMasterOptions();
    expect(publicOnly.error).toBeNull();
    expect(publicOnly.data?.industry).toEqual(["Teknologi"]);
    expect(publicOnly.data?.lead_status).toEqual(["New"]);
    expect(publicOnly.data?.priority.length).toBeGreaterThan(0);
  });

  it("memakai daftar cadangan bila tabel master masih kosong", async () => {
    fake.db.masterOptions = [];

    const result = await getActiveMasterOptions();

    expect(result.error).toBeNull();
    expect(result.data?.industry.length).toBeGreaterThan(0);
    expect(result.data?.lead_status).toContain("New");
  });

  it("menolak nilai kosong, kategori asing, dan duplikat", async () => {
    expect(
      (await createMasterOption({ category: "industry", value: "  " })).error
    ).toMatch(/wajib/);
    expect(
      (
        await createMasterOption({
          category: "bukan_kategori" as never,
          value: "X",
        })
      ).error
    ).toMatch(/tidak dikenal/);
    expect(
      (await createMasterOption({ category: "industry", value: "Teknologi" }))
        .error
    ).toMatch(/sudah ada/);
  });

  it("menambah opsi baru dan menonaktifkannya", async () => {
    const created = await createMasterOption({
      category: "industry",
      value: "Energi",
    });
    expect(created.error).toBeNull();
    expect(created.data?.isActive).toBe(true);

    const toggled = await setMasterOptionActive("industry", "Energi", false);
    expect(toggled.error).toBeNull();
    expect(
      fake.db.masterOptions?.find((row) => row.value === "Energi")?.is_active
    ).toBe(false);
  });

  it("mengubah nama opsi yang belum dipakai", async () => {
    const result = await updateMasterOption("industry", "Retail", {
      value: "Retail Ritel",
      isActive: false,
    });

    expect(result.error).toBeNull();
    expect(result.data?.value).toBe("Retail Ritel");
    expect(
      fake.db.masterOptions?.some((row) => row.value === "Retail Ritel")
    ).toBe(true);
  });

  it("menolak rename dan hapus opsi yang sedang dipakai", async () => {
    fake.db.tables = { leads: [{ status: "New" }] };

    const renamed = await updateMasterOption("lead_status", "New", {
      value: "Baru",
      isActive: true,
    });
    expect(renamed.error).toMatch(/dipakai/);

    const deleted = await deleteMasterOption("lead_status", "New");
    expect(deleted.error).toMatch(/tidak bisa dihapus/);
    expect(
      fake.db.masterOptions?.some((row) => row.value === "New")
    ).toBe(true);
  });

  it("menghapus opsi yang tidak dipakai", async () => {
    const result = await deleteMasterOption("industry", "Retail");

    expect(result.error).toBeNull();
    expect(
      fake.db.masterOptions?.some((row) => row.value === "Retail")
    ).toBe(false);
  });

  it("tidak melaporkan sukses saat database menghapus 0 baris", async () => {
    fake.db.blockedDeleteTables = ["master_options"];

    const result = await deleteMasterOption("industry", "Retail");

    expect(result.error).toMatch(/0 baris/);
    expect(
      fake.db.masterOptions?.some((row) => row.value === "Retail")
    ).toBe(true);
  });
});

describe("tim/PIC", () => {
  it("membaca, menambah, dan memperbarui anggota tim", async () => {
    const initial = await listTeamMembers();
    expect(initial.data?.map((member) => member.name)).toEqual(["Nabila"]);

    const created = await createTeamMember({
      name: "Ayu",
      status: "external",
    });
    expect(created.error).toBeNull();
    expect(created.data?.status).toBe("external");

    const updated = await updateTeamMember(created.data!.id, {
      name: "Ayu Magang",
      status: "external",
    });
    expect(updated.error).toBeNull();
    expect(updated.data?.name).toBe("Ayu Magang");
  });

  it("menolak nama duplikat", async () => {
    const result = await createTeamMember({
      name: "Nabila",
      status: "internal",
    });

    expect(result.error).toMatch(/sudah ada/);
  });

  it("menolak hapus anggota yang sudah dipakai", async () => {
    fake.db.tables = { leads: [{ pic_id: "tm-1" }] };

    const result = await deleteTeamMember("tm-1");

    expect(result.error).toMatch(/tidak bisa dihapus/);
    expect(fake.db.teamMembers).toHaveLength(1);
  });

  it("menghapus anggota yang belum dipakai", async () => {
    const created = await createTeamMember({
      name: "Dimas Freelance",
      status: "external",
    });

    const result = await deleteTeamMember(created.data!.id);

    expect(result.error).toBeNull();
    expect(fake.db.teamMembers).toHaveLength(1);
  });

  it("tidak melaporkan sukses saat tim/PIC terhapus 0 baris", async () => {
    fake.db.blockedDeleteTables = ["team_members"];

    const result = await deleteTeamMember("tm-1");

    expect(result.error).toMatch(/0 baris/);
    expect(fake.db.teamMembers).toHaveLength(1);
  });

  it("dropdown PIC memakai team_members, bukan mock user", async () => {
    const result = await listLeadPICs();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: "tm-1", name: "Nabila" }]);
  });
});
