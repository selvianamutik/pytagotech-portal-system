import type { TaskSummary } from "@/types/task";
import type { ServiceResult } from "@/services/result";

/**
 * Store task minimal untuk rollup progress proyek (US-020, FR-17 parsial).
 * CRUD penuh + sub-task + tanggal + komentar/lampiran menyusul di US-022
 * (file ini diperluas, bukan diganti).
 */

let taskStore: TaskSummary[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockTasks(): void {
  taskStore = [];
}

export async function addTaskSummary(
  input: Omit<TaskSummary, "id">
): Promise<ServiceResult<TaskSummary>> {
  const task: TaskSummary = {
    ...input,
    id: `TSK-${String(taskStore.length + 1).padStart(3, "0")}`,
  };
  taskStore.push(task);
  return { data: { ...task }, error: null };
}

export async function listTaskSummaries(
  projectId: string
): Promise<ServiceResult<TaskSummary[]>> {
  return {
    data: taskStore.filter((task) => task.projectId === projectId).map((task) => ({ ...task })),
    error: null,
  };
}

/**
 * Progress proyek = rata-rata % task level atas (tanpa parent).
 * US-022: % induk dihitung dari sub-task sebelum dirata-rata.
 */
export async function getProjectProgress(projectId: string): Promise<number> {
  const { data } = await listTaskSummaries(projectId);
  const topLevel = (data ?? []).filter((task) => !task.parentId);
  if (topLevel.length === 0) {
    return 0;
  }
  const total = topLevel.reduce((sum, task) => sum + task.percent, 0);
  return Math.round(total / topLevel.length);
}
