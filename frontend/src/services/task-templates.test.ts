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

beforeEach(() => {
  resetMockTaskTemplates();
  resetMockTasks();
});

describe("listTaskTemplates", () => {
  it("terurut dan berisi seed placeholder Q-005", async () => {
    const result = await listTaskTemplates();

    expect(result.error).toBeNull();
    expect((result.data ?? []).map((template) => template.order)).toEqual([1, 2, 3, 4]);
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
    expect(result.data).toHaveLength(4);
    expect(result.data?.[0]).toMatchObject({
      title: "Kickoff & brief internal",
      startDate: "2026-10-05",
      targetDate: "2026-10-06",
    });
    // 2 + 10 + 3 + 1 hari = selesai 2026-10-20.
    expect(result.data?.[3]?.targetDate).toBe("2026-10-20");
    expect((await listTaskSummaries("PRJ-900")).data).toHaveLength(4);
  });

  it("melewati template nonaktif", async () => {
    await updateTaskTemplate("TPL-002", {
      name: "Pengerjaan utama",
      order: 2,
      defaultDurationDays: 10,
      isActive: false,
    });

    const result = await generateTasksForProject("PRJ-900", "2026-10-05");

    expect(result.data).toHaveLength(3);
    expect(result.data?.map((task) => task.title)).not.toContain("Pengerjaan utama");
  });
});
