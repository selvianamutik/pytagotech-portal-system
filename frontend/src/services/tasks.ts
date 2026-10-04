import type { TaskInput, TaskStatus, TaskSummary } from "@/types/task";
import { isTaskStatus } from "@/types/task";
import { listDependencies } from "@/services/task-dependencies";
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

/** Seluruh task lintas proyek (kalender universal). */
export async function listAllTaskSummaries(): Promise<ServiceResult<TaskSummary[]>> {
  return { data: taskStore.map((task) => ({ ...task })), error: null };
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

function shiftDateIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/**
 * Geser task ke tanggal mulai baru (US-025, FR-19): seluruh rentang
 * ikut bergeser; successor FS yang tertabrak ikut tergeser (kaskade).
 * Mengembalikan semua task yang berubah.
 */
export async function moveTaskDates(
  taskId: string,
  newStartDate: string
): Promise<ServiceResult<TaskSummary[]>> {
  const task = taskStore.find((item) => item.id === taskId);
  if (!task) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  if (!task.startDate || Number.isNaN(Date.parse(newStartDate))) {
    return { data: null, error: "Task belum punya tanggal mulai." };
  }
  const shift = diffDays(task.startDate, newStartDate);
  const changed: TaskSummary[] = [];

  const shiftOne = (id: string, days: number) => {
    const item = taskStore.find((candidate) => candidate.id === id);
    if (!item || !item.startDate) {
      return;
    }
    item.startDate = shiftDateIso(item.startDate, days);
    if (item.targetDate) {
      item.targetDate = shiftDateIso(item.targetDate, days);
    }
    changed.push({ ...item });
  };
  shiftOne(taskId, shift);

  // Kaskade FS: successor mulai paling cepat sehari setelah predecessor selesai.
  const { data: dependencies } = await listDependencies(task.projectId);
  const queue = [taskId];
  const visited = new Set([taskId]);
  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const current = taskStore.find((item) => item.id === currentId);
    if (!current?.targetDate) {
      continue;
    }
    const minimumStart = shiftDateIso(current.targetDate, 1);
    for (const dependency of dependencies ?? []) {
      if (dependency.predecessorId !== currentId || visited.has(dependency.successorId)) {
        continue;
      }
      visited.add(dependency.successorId);
      const successor = taskStore.find((item) => item.id === dependency.successorId);
      if (successor?.startDate && successor.startDate <= current.targetDate) {
        const successorShift = diffDays(successor.startDate, minimumStart);
        shiftOne(dependency.successorId, successorShift);
        queue.push(dependency.successorId);
      }
    }
  }
  return { data: changed, error: null };
}
