import { beforeEach, describe, expect, it } from "vitest";

import {
  addTaskSummary,
  deleteTaskSummary,
  effectiveTaskPercent,
  listAllTaskSummaries,
  listTaskSummaries,
  moveTaskSummaryStatus,
  resetMockTasks,
  updateTaskSummary,
} from "@/services/tasks";

beforeEach(() => {
  resetMockTasks();
});

describe("task CRUD", () => {
  it("tambah dengan default To Do + validasi", async () => {
    const created = await addTaskSummary({ projectId: "PRJ-001", title: "Setup repo" });

    expect(created.error).toBeNull();
    expect(created.data?.status).toBe("To Do");
    expect(created.data?.percent).toBe(0);

    expect((await addTaskSummary({ projectId: "PRJ-001", title: "  " })).error).toMatch(
      /Nama aktivitas/
    );
    expect(
      (await addTaskSummary({ projectId: "PRJ-001", title: "X", percent: 150 })).error
    ).toMatch(/0–100/);
    expect(
      (await addTaskSummary({ projectId: "PRJ-001", title: "X", parentId: "TSK-999" })).error
    ).toMatch(/induk/);
  });

  it("ubah field, pindah status, hapus beserta sub-task", async () => {
    const parent = await addTaskSummary({ projectId: "PRJ-001", title: "Induk" });
    await addTaskSummary({ projectId: "PRJ-001", title: "Anak", parentId: parent.data!.id });

    const moved = await moveTaskSummaryStatus(parent.data!.id, "In Progress");
    expect(moved.data?.status).toBe("In Progress");

    const updated = await updateTaskSummary(parent.data!.id, {
      assignee: "Nabila",
      percent: 40,
      notes: "Catatan",
      link: "https://figma.test/x",
    });
    expect(updated.data?.assignee).toBe("Nabila");
    expect(updated.data?.percent).toBe(40);

    await deleteTaskSummary(parent.data!.id);
    expect((await listTaskSummaries("PRJ-001")).data).toHaveLength(0);
  });
});

describe("effectiveTaskPercent", () => {
  it("induk = rata-rata sub-task aktif (rekursif)", async () => {
    const parent = await addTaskSummary({ projectId: "PRJ-001", title: "P", percent: 90 });
    const child = await addTaskSummary({
      projectId: "PRJ-001",
      title: "C",
      percent: 10,
      parentId: parent.data!.id,
    });
    await addTaskSummary({
      projectId: "PRJ-001",
      title: "G",
      percent: 100,
      parentId: child.data!.id,
    });
    // C = 100 (dari G), P = 100.
    const { data } = await listTaskSummaries("PRJ-001");
    expect(effectiveTaskPercent(parent.data!, data ?? [])).toBe(100);
  });
});

describe("listAllTaskSummaries", () => {
  it("menggabungkan task lintas proyek", async () => {
    await addTaskSummary({ projectId: "PRJ-001", title: "A" });
    await addTaskSummary({ projectId: "PRJ-002", title: "B" });

    const { data } = await listAllTaskSummaries();
    expect(data?.map((task) => task.projectId).sort()).toEqual(["PRJ-001", "PRJ-002"]);
  });
});
