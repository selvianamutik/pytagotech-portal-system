import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createHoliday,
  deleteHoliday,
  getPortalSettings,
  saveKpiTargets,
  saveOperationalSettings,
} from "@/services/settings";
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
    tables: {
      settings: [
        { key: "sla.response_minutes", value: 45 },
        { key: "sla.routing_minutes", value: 10 },
        { key: "release.critical_hours", value: 48 },
        {
          key: "service_hours",
          value: {
            timezone: "Asia/Jakarta",
            days: [1, 2, 3, 4, 5],
            start: "08:00",
            end: "17:00",
          },
        },
        { key: "wa.numbers", value: { Pytagotech: "+62 812-3456-7890" } },
        { key: "kpi.targets", value: { Pytagotech: { production: 20, reach: 1000 } } },
      ],
      holidays: [{ day: "2026-12-25", name: "Hari libur nasional" }],
    },
  };
}

beforeEach(() => {
  fake = createSupabaseFake(seedDb());
});

describe("getPortalSettings", () => {
  it("membaca SLA, jam layanan, WA, target KPI, dan hari libur", async () => {
    const { data, error } = await getPortalSettings();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      slaResponseMinutes: 45,
      slaRoutingMinutes: 10,
      releaseCriticalHours: 48,
      serviceHours: {
        timezone: "Asia/Jakarta",
        days: [1, 2, 3, 4, 5],
        start: "08:00",
        end: "17:00",
      },
      waNumbers: { Pytagotech: "+6281234567890", Pytabelajar: "", Pytafix: "" },
      kpiTargets: { Pytagotech: { production: 20, reach: 1000 } },
      holidays: [{ day: "2026-12-25", name: "Hari libur nasional" }],
    });
  });

  it("memakai default saat tabel settings kosong", async () => {
    fake = createSupabaseFake({ ...seedDb(), tables: {} });
    const { data } = await getPortalSettings();

    expect(data?.slaResponseMinutes).toBe(30);
    expect(data?.slaRoutingMinutes).toBe(15);
    expect(data?.releaseCriticalHours).toBe(24);
    expect(data?.serviceHours.days).toEqual([1, 2, 3, 4, 5]);
    expect(data?.holidays).toEqual([]);
  });

  it("mengabaikan nilai rusak dan memakai default", async () => {
    fake = createSupabaseFake({
      ...seedDb(),
      tables: {
        settings: [
          { key: "sla.response_minutes", value: 0 },
          { key: "service_hours", value: { days: [], start: "18:00", end: "09:00" } },
          { key: "wa.numbers", value: { Pytagotech: "abc" } },
        ],
        holidays: [{ day: "2026-02-30", name: "Tanggal mustahil" }],
      },
    });
    const { data } = await getPortalSettings();

    expect(data?.slaResponseMinutes).toBe(30);
    expect(data?.serviceHours.start).toBe("09:00");
    expect(data?.waNumbers.Pytagotech).toBe("");
    expect(data?.holidays).toEqual([]);
  });
});

describe("saveOperationalSettings", () => {
  it("menyimpan SLA, jam layanan, nomor WA, dan ambang kritis", async () => {
    const result = await saveOperationalSettings({
      slaResponseMinutes: 30,
      slaRoutingMinutes: 15,
      releaseCriticalHours: 24,
      serviceHours: {
        timezone: "Asia/Jakarta",
        days: [1, 2, 3, 4, 5, 6],
        start: "09:00",
        end: "18:00",
      },
      waNumbers: { Pytagotech: "+62 811 2222 333" },
    });

    expect(result.error).toBeNull();
    const { data } = await getPortalSettings();
    expect(data?.slaResponseMinutes).toBe(30);
    expect(data?.slaRoutingMinutes).toBe(15);
    expect(data?.serviceHours.days).toEqual([1, 2, 3, 4, 5, 6]);
    expect(data?.waNumbers.Pytagotech).toBe("+628112222333");
  });

  it("menolak SLA, jam layanan, dan nomor WA yang tidak valid", async () => {
    const base = {
      slaResponseMinutes: 30,
      slaRoutingMinutes: 15,
      releaseCriticalHours: 24,
      serviceHours: {
        timezone: "Asia/Jakarta",
        days: [1, 2, 3, 4, 5],
        start: "09:00",
        end: "18:00",
      },
      waNumbers: {},
    };

    expect(
      (await saveOperationalSettings({ ...base, slaResponseMinutes: 0 })).error
    ).toMatch(/SLA respons/);
    expect(
      (
        await saveOperationalSettings({
          ...base,
          serviceHours: { ...base.serviceHours, start: "18:00", end: "09:00" },
        })
      ).error
    ).toMatch(/jam mulai/);
    expect(
      (
        await saveOperationalSettings({
          ...base,
          waNumbers: { Pytagotech: "12ab" },
        })
      ).error
    ).toMatch(/tidak valid/);
  });
});

describe("saveKpiTargets", () => {
  it("menyimpan target per brand dan mempertahankan nilai parsial", async () => {
    const result = await saveKpiTargets({
      Pytagotech: { production: 15, engagement: 3.25 },
      Pytafix: { reach: 250000 },
    });

    expect(result.error).toBeNull();
    const { data } = await getPortalSettings();
    expect(data?.kpiTargets).toEqual({
      Pytagotech: { production: 15, engagement: 3.25 },
      Pytafix: { reach: 250000 },
    });
  });

  it("menolak target negatif", async () => {
    const result = await saveKpiTargets({ Pytagotech: { production: -1 } });
    expect(result.error).toMatch(/angka ≥ 0/);
  });
});

describe("hari libur", () => {
  it("menambah dan menghapus hari libur", async () => {
    const created = await createHoliday("2026-12-24", "Cuti bersama");
    expect(created.error).toBeNull();
    expect(created.data).toEqual({ day: "2026-12-24", name: "Cuti bersama" });

    const duplicate = await createHoliday("2026-12-24");
    expect(duplicate.error).toMatch(/sudah ada/);

    const deleted = await deleteHoliday("2026-12-24");
    expect(deleted.error).toBeNull();
    const { data } = await getPortalSettings();
    expect(data?.holidays.map((holiday) => holiday.day)).toEqual(["2026-12-25"]);
  });

  it("menolak tanggal tidak valid dan hapus 0 baris", async () => {
    expect((await createHoliday("2026-02-30")).error).toMatch(/tidak valid/);
    expect((await deleteHoliday("2026-01-01")).error).toMatch(/0 baris/);
  });
});
