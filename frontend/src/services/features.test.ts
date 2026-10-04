import { beforeEach, describe, expect, it } from "vitest";

import {
  convertFeatureToTask,
  createFeature,
  deleteFeature,
  ensureBacklogFromHandover,
  listAllFeatures,
  listFeatures,
  resetMockFeatures,
  updateFeature,
} from "@/services/features";
import { resetMockTasks } from "@/services/tasks";

beforeEach(() => {
  resetMockFeatures();
  resetMockTasks();
});

describe("feature CRUD", () => {
  it("tambah, ubah, hapus dengan validasi", async () => {
    const created = await createFeature("PRJ-900", {
      name: "Login SSO",
      category: "Autentikasi",
      priority: "High",
      developer: "Nabila",
      estimateDays: 5,
    });

    expect(created.error).toBeNull();
    expect(created.data?.id).toMatch(/^FIT-\d+$/);

    const updated = await updateFeature(created.data!.id, {
      name: "Login SSO",
      category: "Autentikasi",
      priority: "High",
      developer: "Nabila",
      estimateDays: 8,
    });
    expect(updated.data?.estimateDays).toBe(8);

    expect((await deleteFeature(created.data!.id)).error).toBeNull();
    expect((await listFeatures("PRJ-900")).data).toHaveLength(0);
  });

  it("menolak input tak valid", async () => {
    expect(
      (
        await createFeature("PRJ-900", {
          name: " ",
          category: "X",
          priority: "High",
          developer: "",
          estimateDays: 1,
        })
      ).error
    ).toMatch(/Nama fitur/);
    expect(
      (
        await createFeature("PRJ-900", {
          name: "X",
          category: "X",
          priority: "Urgent" as never,
          developer: "",
          estimateDays: 1,
        })
      ).error
    ).toMatch(/Prioritas/);
    expect(
      (
        await createFeature("PRJ-900", {
          name: "X",
          category: "X",
          priority: "Low",
          developer: "",
          estimateDays: 0,
        })
      ).error
    ).toMatch(/Estimasi/);
  });
});

describe("ensureBacklogFromHandover", () => {
  it("mengimpor fitur handover secara idempoten", async () => {
    const first = await ensureBacklogFromHandover("PRJ-900", "HDV-001");

    expect(first.error).toBeNull();
    expect(first.data).toHaveLength(3);
    expect(first.data?.[0]).toMatchObject({ source: "handover", priority: "Medium" });

    const second = await ensureBacklogFromHandover("PRJ-900", "HDV-001");
    expect(second.data).toHaveLength(0);
    expect((await listFeatures("PRJ-900")).data).toHaveLength(3);
  });

  it("menolak handover tak dikenal", async () => {
    expect((await ensureBacklogFromHandover("PRJ-900", "HDV-999")).error).toBe(
      "Deal handover tidak ditemukan."
    );
  });
});

describe("convertFeatureToTask", () => {
  it("membuat task tertaut dan menolak konversi ganda", async () => {
    const created = await createFeature("PRJ-900", {
      name: "Notifikasi WA",
      category: "Integrasi",
      priority: "Low",
      developer: "Raka",
      estimateDays: 2,
    });

    const converted = await convertFeatureToTask(created.data!.id);
    expect(converted.error).toBeNull();
    expect(converted.data?.taskId).toMatch(/^TSK-/);

    expect((await convertFeatureToTask(created.data!.id)).error).toMatch(
      /sudah dijadikan task/
    );
    expect((await convertFeatureToTask("FIT-999")).error).toBe("Fitur tidak ditemukan.");
  });
});

describe("listAllFeatures", () => {
  it("menggabungkan fitur lintas proyek", async () => {
    await createFeature("PRJ-901", {
      name: "F1",
      category: "Web",
      priority: "High",
      developer: "",
      estimateDays: 1,
    });
    await createFeature("PRJ-902", {
      name: "F2",
      category: "Web",
      priority: "Low",
      developer: "",
      estimateDays: 1,
    });

    const { data } = await listAllFeatures();
    const ids = (data ?? [])
      .filter((feature) => feature.projectId === "PRJ-901" || feature.projectId === "PRJ-902")
      .map((feature) => feature.projectId)
      .sort();
    expect(ids).toEqual(["PRJ-901", "PRJ-902"]);
  });
});
