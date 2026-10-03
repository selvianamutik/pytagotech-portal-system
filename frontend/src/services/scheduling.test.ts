import { beforeEach, describe, expect, it } from "vitest";

import { resetMockFeatures, updateFeature } from "@/services/features";
import { resetMockProjects, createProjectFromHandover } from "@/services/projects";
import { resetMockClients } from "@/services/clients";
import { resetMockDeals } from "@/services/deals";
import { resetMockTerms } from "@/services/deal-terms";
import { resetMockAudit } from "@/services/audit";
import { resetMockCollaboration } from "@/services/collaboration";
import { transitionDealStatus } from "@/services/deal-workflow";
import {
  addWorkdays,
  getScheduleSettings,
  isWorkday,
  overrideFeatureSchedule,
  resetMockScheduling,
  scheduleProjectFeatures,
  setScheduleSettings,
} from "@/services/scheduling";

const pm = { id: "USR-003", name: "Raka", roles: ["Project Manager"] };

async function seedProject(): Promise<string> {
  await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: pm });
  const created = await createProjectFromHandover("HDV-001", {
    pmName: "Raka",
    startDate: "2026-10-05",
  });
  return created.data!.id;
}

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
  resetMockAudit();
  resetMockCollaboration();
  resetMockProjects();
  resetMockFeatures();
  resetMockScheduling();
});

describe("kalender kerja", () => {
  it("Sabtu/Minggu dan libur bukan hari kerja", () => {
    // 2026-10-04 = Minggu, 2026-10-05 = Senin.
    expect(isWorkday("2026-10-04", [])).toBe(false);
    expect(isWorkday("2026-10-05", [])).toBe(true);
    expect(isWorkday("2026-10-05", ["2026-10-05"])).toBe(false);
  });

  it("addWorkdays melompati akhir pekan", () => {
    // Jumat + 1 hari kerja = Senin.
    expect(addWorkdays("2026-10-02", 1, [])).toBe("2026-10-05");
    expect(addWorkdays("2026-10-05", 0, [])).toBe("2026-10-05");
  });
});

describe("scheduleProjectFeatures", () => {
  it("menjadwalkan berurutan per developer sesuai prioritas", async () => {
    const projectId = await seedProject();
    // HDV-001: Landing(0), Katalog(1), Form WA(2) — atur dev & prioritas.
    const { listFeatures } = await import("@/services/features");
    const features = (await listFeatures(projectId)).data ?? [];
    const byName = (name: string) => features.find((feature) => feature.name === name)!.id;
    await updateFeature(byName("Landing page"), {
      name: "Landing page", category: "Web", priority: "High", developer: "Nabila", estimateDays: 2,
    });
    await updateFeature(byName("Katalog produk"), {
      name: "Katalog produk", category: "Web", priority: "Medium", developer: "Nabila", estimateDays: 1,
    });
    await updateFeature(byName("Form kontak WA"), {
      name: "Form kontak WA", category: "Web", priority: "Low", developer: "Raka", estimateDays: 1,
    });

    const { data } = await scheduleProjectFeatures(projectId);
    const byId = new Map((data ?? []).map((item) => [item.featureId, item]));

    // Nabila: High 2 hari (Sen–Sel) lalu Medium 1 hari (Rab).
    expect(byId.get(byName("Landing page"))).toMatchObject({
      startDate: "2026-10-05",
      endDate: "2026-10-06",
    });
    expect(byId.get(byName("Katalog produk"))).toMatchObject({
      startDate: "2026-10-07",
      endDate: "2026-10-07",
    });
    // Raka paralel mulai hari pertama.
    expect(byId.get(byName("Form kontak WA"))?.startDate).toBe("2026-10-05");
    expect((data ?? []).every((item) => item.conflictsWith.length === 0)).toBe(true);
  });

  it("kapasitas paruh waktu menggandakan durasi", async () => {
    const projectId = await seedProject();
    await setScheduleSettings({ holidays: [], capacityHoursPerDay: { Nabila: 4 } });
    const { listFeatures } = await import("@/services/features");
    const features = (await listFeatures(projectId)).data ?? [];
    const first = features[0]!;
    await updateFeature(first.id, {
      name: first.name, category: "Web", priority: "High", developer: "Nabila", estimateDays: 2,
    });

    const { data } = await scheduleProjectFeatures(projectId);
    // 2 hari-orang @4 jam = 4 hari kalender kerja: Sen–Kam.
    expect(data?.find((item) => item.featureId === first.id)).toMatchObject({
      startDate: "2026-10-05",
      endDate: "2026-10-08",
    });
  });

  it("override manual wajib beralasan dan memicu peringatan bentrok", async () => {
    const projectId = await seedProject();
    const { listFeatures } = await import("@/services/features");
    const features = (await listFeatures(projectId)).data ?? [];
    for (const feature of features.slice(0, 2)) {
      await updateFeature(feature.id, {
        name: feature.name, category: "Web", priority: "Medium", developer: "Nabila", estimateDays: 2,
      });
    }
    const [first, second] = features;

    // Tanpa alasan ditolak.
    expect(
      (
        await overrideFeatureSchedule(first!.id, {
          startDate: "2026-10-05",
          endDate: "2026-10-06",
          reason: " ",
        })
      ).error
    ).toMatch(/Alasan/);

    // Geser fitur kedua menumpuk fitur pertama.
    await overrideFeatureSchedule(first!.id, {
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      reason: "Didahulukan atas permintaan klien.",
    });
    await overrideFeatureSchedule(second!.id, {
      startDate: "2026-10-06",
      endDate: "2026-10-07",
      reason: "Menyesuaikan jadwal rilis.",
    });

    const { data } = await scheduleProjectFeatures(projectId);
    const conflicts = data?.find((item) => item.featureId === second!.id)?.conflictsWith;
    expect(conflicts).toContain(first!.id);
    expect(
      data?.find((item) => item.featureId === first!.id)?.overridden
    ).toBe(true);
  });
});

describe("setScheduleSettings", () => {
  it("menyimpan libur dan kapasitas", async () => {
    const result = await setScheduleSettings({
      holidays: ["2026-12-24", "2026-12-24"],
      capacityHoursPerDay: { Nabila: 6 },
    });

    expect(result.data?.holidays).toEqual(["2026-12-24"]);
    expect((await getScheduleSettings()).data?.capacityHoursPerDay.Nabila).toBe(6);
  });
});
