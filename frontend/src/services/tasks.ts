import type { TaskInput, TaskStatus, TaskSummary } from "@/types/task";
import { isTaskStatus } from "@/types/task";
import type { ServiceResult } from "@/services/result";

/**
 * Store task proyek (US-020 minimal → US-022 penuh, FR-17):
 * CRUD, Kanban status, sub-task + rollup %, komentar/lampiran
 * lewat komponen US-006 (`entityType: "task"`).
 */

let taskStore: TaskSummary[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockTasks(): void {
  taskStore = [];
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function validateTaskInput(input: TaskInput): string | null {
  if (input.title !== undefined && input.title.trim().length === 0) {
    return "Nama aktivitas wajib diisi.";
  }
  if (input.status !== undefined && !isTaskStatus(input.status)) {
    return "Status task tidak dikenal.";
  }
  if (input.percent !== undefined && (!Number.isFinite(input.percent) || input.percent < 0 || input.percent > 100)) {
    return "Progress harus 0–100.";
  }
  for (const key of ["startDate", "targetDate"] as const) {
    const value = input[key];
    if (value !== undefined && value !== "" && Number.isNaN(Date.parse(value))) {
      return `Tanggal task (${key}) tidak valid.`;
    }
  }
  return null;
}

export async function addTaskSummary(
  input: Omit<TaskSummary, "id" | "percent" | "isActive" | "status"> & {
    percent?: number;
    isActive?: boolean;
    status?: TaskStatus;
  }
): Promise<ServiceResult<TaskSummary>> {
  const validationError = validateTaskInput({
    title: input.title,
    status: input.status,
    percent: input.percent,
    startDate: input.startDate,
    targetDate: input.targetDate,
  });
  if (validationError) {
    return { data: null, error: validationError };
  }
  if (input.parentId && !taskStore.some((task) => task.id === input.parentId)) {
    return { data: null, error: "Task induk tidak ditemukan." };
  }
  const task: TaskSummary = {
    isActive: input.isActive ?? true,
    percent: clampPercent(input.percent ?? 0),
    status: input.status ?? "To Do",
    ...input,
    id: `TSK-${String(taskStore.length + 1).padStart(3, "0")}`,
  };
  taskStore.push(task);
  return { data: { ...task }, error: null };
}

export async function updateTaskSummary(
  taskId: string,
  input: TaskInput
): Promise<ServiceResult<TaskSummary>> {
  const task = taskStore.find((item) => item.id === taskId);
  if (!task) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  const validationError = validateTaskInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  if (input.title !== undefined) {
    task.title = input.title.trim();
  }
  if (input.assignee !== undefined) {
    task.assignee = input.assignee;
  }
  if (input.status !== undefined) {
    task.status = input.status;
  }
  if (input.startDate !== undefined) {
    task.startDate = input.startDate || undefined;
  }
  if (input.targetDate !== undefined) {
    task.targetDate = input.targetDate || undefined;
  }
  if (input.percent !== undefined) {
    task.percent = clampPercent(input.percent);
  }
  if (input.notes !== undefined) {
    task.notes = input.notes;
  }
  if (input.link !== undefined) {
    task.link = input.link;
  }
  return { data: { ...task }, error: null };
}

/** Pindah status (dipakai drag-and-drop Kanban). */
export async function moveTaskSummaryStatus(
  taskId: string,
  status: TaskStatus
): Promise<ServiceResult<TaskSummary>> {
  return updateTaskSummary(taskId, { status });
}

export async function deleteTaskSummary(taskId: string): Promise<ServiceResult<true>> {
  const index = taskStore.findIndex((task) => task.id === taskId);
  if (index === -1) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  // Hapus beserta sub-task-nya.
  const ids = new Set([taskId]);
  taskStore
    .filter((task) => task.parentId && ids.has(task.parentId))
    .forEach((task) => ids.add(task.id));
  taskStore = taskStore.filter((task) => !ids.has(task.id));
  return { data: true, error: null };
}

export async function setTaskSummaryActive(
  taskId: string,
  isActive: boolean
): Promise<ServiceResult<TaskSummary>> {
  const task = taskStore.find((item) => item.id === taskId);
  if (!task) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  task.isActive = isActive;
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
 * % efektif task: bila punya sub-task aktif, rata-rata sub-task;
 * bila tidak, % sendiri. (FR-17: % induk dari sub-task.)
 */
export function effectiveTaskPercent(
  task: TaskSummary,
  all: TaskSummary[]
): number {
  const children = all.filter(
    (item) => item.parentId === task.id && item.isActive !== false
  );
  if (children.length === 0) {
    return task.percent;
  }
  const total = children.reduce((sum, child) => sum + effectiveTaskPercent(child, all), 0);
  return Math.round(total / children.length);
}

/**
 * Progress proyek = rata-rata % efektif task level atas yang aktif.
 */
export async function getProjectProgress(projectId: string): Promise<number> {
  const { data } = await listTaskSummaries(projectId);
  const all = data ?? [];
  const topLevel = all.filter((task) => !task.parentId && task.isActive !== false);
  if (topLevel.length === 0) {
    return 0;
  }
  const total = topLevel.reduce((sum, task) => sum + effectiveTaskPercent(task, all), 0);
  return Math.round(total / topLevel.length);
}
