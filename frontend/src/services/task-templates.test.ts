import { beforeEach, describe, expect, it } from "vitest";

import {
  createTaskTemplate,
  deleteTaskTemplate,
  generateTasksForProject,
  listTaskTemplates,
  resetMockTaskTemplates,
  updateTaskTemplate,
} from "@/services/task-templates";
import { listTaskSummaries, resetMockTasks } from "@/services/tasks";
import { seedProjectFixture } from "@/test/fixtures";

beforeEach(async () => {
  resetMockTaskTemplates();
  resetMockTasks();
  await seedProjectFixture("PRJ-900");
});

describe("listTaskTemplates", () => {
  it("terurut dan berisi seed RAD, PUS, SAD Q-005", async () => {
    const result = await listTaskTemplates();

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject([
      { name: "Pembuatan dokumen RAD", order: 1, defaultDurationDays: 3 },
      { name: "Pembuatan dokumen PUS", order: 2, defaultDurationDays: 3 },
      { name: "Pembuatan dokumen SAD", order: 3, defaultDurationDays: 3 },
    ]);
  });
});

describe("template CRUD", () => {
  it("tambah, ubah, nonaktifkan, hapus", async () => {
    const created = await createTaskTemplate({
      name: "Testing",
      order: 5,
      defaultDurationDays: 2,
    });
    expect(created.error).toBeNull();

    const updated = await updateTaskTemplate(created.data!.id, {
      name: "Testing & UAT",
      order: 5,
      defaultDurationDays: 3,
      isActive: false,
    });
    expect(updated.data?.isActive).toBe(false);

    expect((await deleteTaskTemplate(created.data!.id)).error).toBeNull();
    expect((await deleteTaskTemplate("TPL-999")).error).toBe("Template tidak ditemukan.");
  });

  it("menolak input tak valid", async () => {
    expect(
      (await createTaskTemplate({ name: " ", order: 1, defaultDurationDays: 1 })).error
    ).toMatch(/Nama/);
    expect(
      (await createTaskTemplate({ name: "X", order: 0, defaultDurationDays: 1 })).error
    ).toMatch(/Urutan/);
    expect(
      (await createTaskTemplate({ name: "X", order: 1, defaultDurationDays: 0 })).error
    ).toMatch(/Durasi/);
  });
});

describe("generateTasksForProject", () => {
  it("membuat task berurutan dari tanggal mulai", async () => {
    const result = await generateTasksForProject("PRJ-900", "2026-10-05");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3);
    expect(result.data?.[0]).toMatchObject({
      title: "Pembuatan dokumen RAD",
      startDate: "2026-10-05",
      targetDate: "2026-10-07",
    });
    // 3 + 3 + 3 hari kerja, melewati akhir pekan = selesai 2026-10-15.
    expect(result.data?.[2]?.targetDate).toBe("2026-10-15");
    expect((await listTaskSummaries("PRJ-900")).data).toHaveLength(3);
  });

  it("melewati template nonaktif", async () => {
    const templates = (await listTaskTemplates()).data ?? [];
    const second = templates.find((template) => template.order === 2)!;
    await updateTaskTemplate(second.id, {
      name: "Pembuatan dokumen PUS",
      order: 2,
      defaultDurationDays: 3,
      isActive: false,
    });

    const result = await generateTasksForProject("PRJ-900", "2026-10-05");

    expect(result.data).toHaveLength(2);
    expect(result.data?.map((task) => task.title)).not.toContain("Pembuatan dokumen PUS");
  });
});
