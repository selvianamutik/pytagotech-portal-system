import { beforeEach, describe, expect, it } from "vitest";

import { resetMockTasks, addTaskSummary, moveTaskDates } from "@/services/tasks";
import {
  addDependency,
  listDependencies,
  removeDependency,
  resetMockDependencies,
} from "@/services/task-dependencies";

beforeEach(() => {
  resetMockTasks();
  resetMockDependencies();
});

async function seedChain() {
  const a = await addTaskSummary({
    projectId: "PRJ-001",
    title: "A",
    startDate: "2026-10-05",
    targetDate: "2026-10-06",
  });
  const b = await addTaskSummary({
    projectId: "PRJ-001",
    title: "B",
    startDate: "2026-10-07",
    targetDate: "2026-10-08",
  });
  return { a: a.data!.id, b: b.data!.id };
}

describe("dependencies", () => {
  it("tambah, tolak duplikat/siklus/diri-sendiri, hapus", async () => {
    const { a, b } = await seedChain();

    expect((await addDependency("PRJ-001", a, b)).error).toBeNull();
    expect((await addDependency("PRJ-001", a, b)).error).toMatch(/sudah ada/);
    expect((await addDependency("PRJ-001", b, a)).error).toMatch(/siklus/);
    expect((await addDependency("PRJ-001", a, a)).error).toMatch(/sendiri/);
    expect((await listDependencies("PRJ-001")).data).toHaveLength(1);

    const depId = (await listDependencies("PRJ-001")).data![0]!.id;
    expect((await removeDependency(depId)).error).toBeNull();
    expect((await removeDependency("DEP-999")).error).toBe("Dependensi tidak ditemukan.");
  });
});

describe("moveTaskDates", () => {
  it("menggeser rentang dan mengkaskade successor FS", async () => {
    const { a, b } = await seedChain();
    await addDependency("PRJ-001", a, b);

    // Geser A +3 hari (5→8, selesai 9); B (mulai 7) tertabrak → ikut ke 10–11.
    const moved = await moveTaskDates(a, "2026-10-08");

    expect(moved.error).toBeNull();
    const changed = new Map(moved.data!.map((task) => [task.id, task]));
    expect(changed.get(a)).toMatchObject({ startDate: "2026-10-08", targetDate: "2026-10-09" });
    expect(changed.get(b)).toMatchObject({ startDate: "2026-10-10", targetDate: "2026-10-11" });
  });

  it("tanpa dependensi hanya menggeser satu task", async () => {
    const { a } = await seedChain();
    const moved = await moveTaskDates(a, "2026-10-06");

    expect(moved.data).toHaveLength(1);
    expect(moved.data?.[0]).toMatchObject({ startDate: "2026-10-06", targetDate: "2026-10-07" });
  });

  it("menolak task tak dikenal dan tanpa tanggal", async () => {
    expect((await moveTaskDates("TSK-999", "2026-10-06")).error).toBe("Task tidak ditemukan.");
    const dateless = await addTaskSummary({ projectId: "PRJ-001", title: "X" });
    expect((await moveTaskDates(dateless.data!.id, "2026-10-06")).error).toMatch(
      /belum punya tanggal/
    );
  });
});
