import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveCsvFilename,
  archiveRecord,
  buildCsv,
  exportModuleCsv,
  listArchiveItems,
  restoreRecord,
} from "@/services/archive";
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
    teamMembers: [
      {
        id: "tm-1",
        profile_id: null,
        name: "Nabila",
        status: "internal",
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "tm-2",
        profile_id: null,
        name: "Raka",
        status: "internal",
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    tables: {
      clients: [{ id: "cl-1", company_name: "PT Contoh" }],
      leads: [
        {
          id: "lead-1",
          display_id: "LEAD-001",
          contact_date: "2026-09-01",
          company_name: "PT Alpha",
          industry: "Teknologi",
          whatsapp: "628111222",
          instagram: "@alpha",
          email: "alpha@example.com",
          pic_id: "tm-1",
          status: "Interest",
          next_follow_up: "2026-10-10",
          source: "Sosmed/Instagram",
          archived_at: null,
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-10-01T00:00:00.000Z",
        },
        {
          id: "lead-2",
          display_id: "LEAD-002",
          contact_date: "2026-08-01",
          company_name: "PT Beta",
          industry: "Retail & E-commerce",
          whatsapp: "628111333",
          instagram: null,
          email: "beta@example.com",
          pic_id: null,
          status: "Lost",
          next_follow_up: null,
          source: null,
          archived_at: "2026-10-02T00:00:00.000Z",
          created_at: "2026-08-01T00:00:00.000Z",
          updated_at: "2026-10-02T00:00:00.000Z",
        },
      ],
      projects: [
        {
          id: "project-1",
          display_id: "PRJ-001",
          name: "Portal Alpha",
          code: "HDV-001",
          client_id: "cl-1",
          pm_id: "tm-2",
          start_date: "2026-09-01",
          target_date: "2026-12-01",
          value_idr: 10000000,
          status: "Active",
          handover_id: "deal-1",
          archived_at: null,
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-10-03T00:00:00.000Z",
        },
      ],
      content_materials: [
        {
          id: "material-1",
          display_id: "MAT-0001",
          title: "Carousel Edukasi",
          brand: "Pytagotech",
          status: "Draf",
          schedule_date: "2026-10-10",
          release_time: "10:00",
          draft_link: "https://example.com/draf",
          copywriter_id: "tm-1",
          designer_id: null,
          video_editor_id: null,
          archived_at: null,
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-10-04T00:00:00.000Z",
        },
        {
          id: "material-2",
          display_id: "MAT-0002",
          title: "Reels Lama",
          brand: "Pytafix",
          status: "Rilis",
          schedule_date: null,
          release_time: null,
          draft_link: null,
          copywriter_id: null,
          designer_id: null,
          video_editor_id: null,
          archived_at: "2026-10-05T00:00:00.000Z",
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-10-05T00:00:00.000Z",
        },
      ],
    },
  };
}

beforeEach(() => {
  fake = createSupabaseFake(seedDb());
});

describe("listArchiveItems", () => {
  it("memetakan lead, proyek, materi, dan status arsip", async () => {
    const { data, error } = await listArchiveItems();

    expect(error).toBeNull();
    expect(data).toHaveLength(5);
    expect(data?.map((item) => item.displayId)).toEqual([
      "MAT-0002",
      "MAT-0001",
      "PRJ-001",
      "LEAD-002",
      "LEAD-001",
    ]);

    const lead = data?.find((item) => item.displayId === "LEAD-001");
    expect(lead).toMatchObject({
      type: "lead",
      title: "PT Alpha",
      status: "Interest",
      archivedAt: null,
    });
    expect(lead?.subtitle).toContain("PIC Nabila");

    const archivedLead = data?.find((item) => item.displayId === "LEAD-002");
    expect(archivedLead?.archivedAt).toBe("2026-10-02T00:00:00.000Z");
    expect(archivedLead?.subtitle).toContain("Tanpa PIC");

    const project = data?.find((item) => item.displayId === "PRJ-001");
    expect(project?.subtitle).toContain("PT Contoh");
    expect(project?.subtitle).toContain("PM Raka");

    const material = data?.find((item) => item.displayId === "MAT-0001");
    expect(material?.subtitle).toContain("Jadwal 2026-10-10");
    expect(material?.subtitle).toContain("Copywriter Nabila");
  });
});

describe("archiveRecord / restoreRecord", () => {
  it("mengisi dan membersihkan archived_at lewat RPC", async () => {
    const archived = await archiveRecord("lead", "lead-1");
    expect(archived.error).toBeNull();
    expect(
      fake.db.tables?.leads.find((row) => row.id === "lead-1")?.archived_at
    ).toBeTruthy();

    const restored = await restoreRecord("lead", "lead-1");
    expect(restored.error).toBeNull();
    expect(
      fake.db.tables?.leads.find((row) => row.id === "lead-1")?.archived_at
    ).toBeNull();
  });

  it("menolak ID yang tidak ditemukan tanpa klaim sukses", async () => {
    const result = await archiveRecord("project", "project-tidak-ada");

    expect(result.error).toContain("tidak ditemukan");
  });

  it("menerjemahkan error otorisasi RPC", async () => {
    fake.db.rpcError = {
      code: "42501",
      message: "Hanya Super Admin yang dapat mengarsipkan data.",
    };

    const result = await archiveRecord("lead", "lead-1");

    expect(result.error).toContain("tidak berwenang");
    expect(
      fake.db.tables?.leads.find((row) => row.id === "lead-1")?.archived_at
    ).toBeNull();
  });

  it("menolak ID kosong sebelum memanggil database", async () => {
    const result = await restoreRecord("content_material", "   ");

    expect(result.error).toContain("ID data wajib diisi");
  });
});

describe("buildCsv", () => {
  it("memakai BOM UTF-8 dan meng-escape tanda kutip serta koma", () => {
    const csv = buildCsv(
      ["Nama", "Catatan"],
      [["PT A, B", 'kata "penting"']]
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"PT A, B"');
    expect(csv).toContain('"kata ""penting"""');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});

describe("exportModuleCsv", () => {
  it("mengekspor lead termasuk PIC dan kolom arsip", async () => {
    const { data, error } = await exportModuleCsv("lead");

    expect(error).toBeNull();
    expect(data?.filename).toMatch(/^lead-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(data?.content).toContain("ID Lead");
    expect(data?.content).toContain("PT Alpha");
    expect(data?.content).toContain("PT Beta");
    expect(data?.content).toContain("Nabila");
    expect(data?.content).toContain("Diarsipkan");
    expect(data?.content).toContain("2026-10-02T00:00:00.000Z");
  });

  it("mengekspor proyek dengan nama klien dan PM", async () => {
    const { data, error } = await exportModuleCsv("project");

    expect(error).toBeNull();
    expect(data?.content).toContain("PRJ-001");
    expect(data?.content).toContain("Portal Alpha");
    expect(data?.content).toContain("PT Contoh");
    expect(data?.content).toContain("Raka");
    expect(data?.content).toContain("10000000");
  });

  it("mengekspor materi konten dengan tim produksi", async () => {
    const { data, error } = await exportModuleCsv("content_material");

    expect(error).toBeNull();
    expect(data?.content).toContain("MAT-0001");
    expect(data?.content).toContain("Carousel Edukasi");
    expect(data?.content).toContain("Nabila");
    expect(data?.content).toContain("Reels Lama");
  });
});

describe("archiveCsvFilename", () => {
  it("memakai tanggal WIB-agnostic ISO dan nama modul yang ramah", () => {
    expect(
      archiveCsvFilename("content_material", new Date("2026-10-27T10:00:00Z"))
    ).toBe("materi-konten-2026-10-27.csv");
    expect(archiveCsvFilename("project", new Date("2026-10-27T10:00:00Z"))).toBe(
      "project-2026-10-27.csv"
    );
  });
});
