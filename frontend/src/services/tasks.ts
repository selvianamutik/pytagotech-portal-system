import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import {
  loadDisplayMap,
  loadMemberMaps,
  resolveDisplayUuid,
} from "@/services/production-refs";
import { listDependencies } from "@/services/task-dependencies";
import type { TaskInput, TaskStatus, TaskSummary } from "@/types/task";
import { isTaskStatus } from "@/types/task";
import type { ServiceResult } from "@/services/result";

/**
 * Store task proyek (US-020 minimal → US-022 penuh, FR-17):
 * CRUD, Kanban status, sub-task + rollup %, komentar/lampiran
 * lewat komponen US-006 (`entityType: "task"`).
 *
 * Database-backed: UI memakai display ID (`TSK-xxx`), service memetakan ke
 * UUID internal dan nama assignee ke `team_members`. Kolom `percent` hanya
 * menyimpan progres task itu sendiri; persentase induk/proyek dihitung ulang
 * dari sub-task (tidak disimpan agar tidak basi).
 */

interface TaskRow {
  id: string;
  display_id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  assignee_id: string | null;
  status: string;
  start_date: string | null;
  target_date: string | null;
  percent: number | string;
  notes: string | null;
  link: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TASK_COLUMNS =
  "id, display_id, project_id, parent_id, title, assignee_id, status, start_date, target_date, percent, notes, link, is_active, created_at, updated_at";

interface TaskLookups {
  taskMap: NonNullable<Awaited<ReturnType<typeof loadDisplayMap>>["data"]>;
  projectMap: NonNullable<Awaited<ReturnType<typeof loadDisplayMap>>["data"]>;
  memberMap: NonNullable<Awaited<ReturnType<typeof loadMemberMaps>>["data"]>;
}

/** Backward-compat no-op untuk test runner. */
export function resetMockTasks(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
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
  if (
    input.percent !== undefined &&
    (!Number.isFinite(input.percent) || input.percent < 0 || input.percent > 100)
  ) {
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

async function loadTaskLookups(): Promise<ServiceResult<TaskLookups>> {
  const [taskMap, projectMap, memberMap] = await Promise.all([
    loadDisplayMap("tasks"),
    loadDisplayMap("projects"),
    loadMemberMaps(),
  ]);
  const error = taskMap.error ?? projectMap.error ?? memberMap.error;
  if (error || !taskMap.data || !projectMap.data || !memberMap.data) {
    return { data: null, error: error ?? "Gagal memuat relasi task." };
  }
  return {
    data: {
      taskMap: taskMap.data,
      projectMap: projectMap.data,
      memberMap: memberMap.data,
    },
    error: null,
  };
}

function toTaskSummary(row: TaskRow, lookups: TaskLookups): TaskSummary {
  return {
    id: row.display_id,
    projectId:
      lookups.projectMap?.displayById.get(row.project_id) ?? row.project_id,
    title: row.title,
    percent: clampPercent(Number(row.percent)),
    parentId: row.parent_id
      ? lookups.taskMap?.displayById.get(row.parent_id) ?? row.parent_id
      : undefined,
    startDate: row.start_date ?? undefined,
    targetDate: row.target_date ?? undefined,
    assignee: row.assignee_id
      ? lookups.memberMap?.nameById.get(row.assignee_id) ?? undefined
      : undefined,
    isActive: row.is_active,
    status: row.status as TaskStatus,
    notes: row.notes ?? undefined,
    link: row.link ?? undefined,
  };
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

  const project = await resolveDisplayUuid("projects", input.projectId, "Proyek");
  if (project.error || !project.data) {
    return { data: null, error: project.error ?? "Proyek tidak ditemukan." };
  }

  let parentId: string | null = null;
  if (input.parentId) {
    const parent = await resolveDisplayUuid("tasks", input.parentId, "Task induk");
    if (parent.error || !parent.data) {
      return { data: null, error: "Task induk tidak ditemukan." };
    }
    parentId = parent.data;
  }

  const members = await loadMemberMaps();
  if (members.error || !members.data) {
    return {
      data: null,
      error: members.error ?? "Gagal memuat data tim.",
    };
  }
  let assigneeId: string | null = null;
  if (input.assignee?.trim()) {
    assigneeId = members.data.idByName.get(input.assignee.trim()) ?? null;
    if (!assigneeId) {
      return { data: null, error: "Penanggung jawab tidak dikenal." };
    }
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: project.data,
      parent_id: parentId,
      title: input.title.trim(),
      assignee_id: assigneeId,
      status: input.status ?? "To Do",
      start_date: input.startDate || null,
      target_date: input.targetDate || null,
      percent: clampPercent(input.percent ?? 0),
      notes: input.notes ?? null,
      link: input.link ?? null,
      is_active: input.isActive ?? true,
    })
    .select(TASK_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as TaskRow[])[0];
  if (!row) {
    return { data: null, error: "Task gagal dibuat." };
  }
  const lookups = await loadTaskLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  return { data: toTaskSummary(row, lookups.data), error: null };
}

export async function updateTaskSummary(
  taskId: string,
  input: TaskInput
): Promise<ServiceResult<TaskSummary>> {
  const validationError = validateTaskInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const task = await resolveDisplayUuid("tasks", taskId, "Task");
  if (task.error || !task.data) {
    return { data: null, error: task.error ?? "Task tidak ditemukan." };
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) {
    patch.title = input.title.trim();
  }
  if (input.assignee !== undefined) {
    if (!input.assignee.trim()) {
      patch.assignee_id = null;
    } else {
      const members = await loadMemberMaps();
      if (members.error || !members.data) {
        return { data: null, error: members.error ?? "Gagal memuat data tim." };
      }
      const assigneeId = members.data.idByName.get(input.assignee.trim());
      if (!assigneeId) {
        return { data: null, error: "Penanggung jawab tidak dikenal." };
      }
      patch.assignee_id = assigneeId;
    }
  }
  if (input.status !== undefined) {
    patch.status = input.status;
  }
  if (input.startDate !== undefined) {
    patch.start_date = input.startDate || null;
  }
  if (input.targetDate !== undefined) {
    patch.target_date = input.targetDate || null;
  }
  if (input.percent !== undefined) {
    patch.percent = clampPercent(input.percent);
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.link !== undefined) {
    patch.link = input.link;
  }
  if (input.parentId !== undefined) {
    if (!input.parentId) {
      patch.parent_id = null;
    } else {
      const parent = await resolveDisplayUuid(
        "tasks",
        input.parentId,
        "Task induk"
      );
      if (parent.error || !parent.data) {
        return { data: null, error: "Task induk tidak ditemukan." };
      }
      if (parent.data === task.data) {
        return { data: null, error: "Task tidak dapat menjadi induk dirinya sendiri." };
      }
      patch.parent_id = parent.data;
    }
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", task.data)
    .select(TASK_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as TaskRow[])[0];
  if (!row) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  const lookups = await loadTaskLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  return { data: toTaskSummary(row, lookups.data), error: null };
}

/** Pindah status (dipakai drag-and-drop Kanban). */
export async function moveTaskSummaryStatus(
  taskId: string,
  status: TaskStatus
): Promise<ServiceResult<TaskSummary>> {
  return updateTaskSummary(taskId, { status });
}

export async function deleteTaskSummary(
  taskId: string
): Promise<ServiceResult<true>> {
  const task = await resolveDisplayUuid("tasks", taskId, "Task");
  if (task.error || !task.data) {
    return { data: null, error: task.error ?? "Task tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", task.data)
    .select("id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  // Sub-task dan dependensi ikut terhapus lewat ON DELETE CASCADE di database.
  return { data: true, error: null };
}

export async function setTaskSummaryActive(
  taskId: string,
  isActive: boolean
): Promise<ServiceResult<TaskSummary>> {
  const task = await resolveDisplayUuid("tasks", taskId, "Task");
  if (task.error || !task.data) {
    return { data: null, error: task.error ?? "Task tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", task.data)
    .select(TASK_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as TaskRow[])[0];
  if (!row) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  const lookups = await loadTaskLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  return { data: toTaskSummary(row, lookups.data), error: null };
}

export async function listTaskSummaries(
  projectId: string
): Promise<ServiceResult<TaskSummary[]>> {
  const project = await resolveDisplayUuid("projects", projectId, "Proyek");
  if (project.error || !project.data) {
    // Proyek tanpa task (atau belum ada) ditampilkan kosong, bukan error.
    return { data: [], error: null };
  }
  const supabase = getSupabaseClient();
  const [{ data, error }, lookups] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("project_id", project.data)
      .order("created_at", { ascending: true }),
    loadTaskLookups(),
  ]);
  if (error) {
    return { data: null, error: error.message };
  }
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  return {
    data: ((data ?? []) as TaskRow[]).map((row) =>
      toTaskSummary(row, lookups.data as TaskLookups)
    ),
    error: null,
  };
}

/** Seluruh task lintas proyek (kalender universal). */
export async function listAllTaskSummaries(): Promise<ServiceResult<TaskSummary[]>> {
  const supabase = getSupabaseClient();
  const [{ data, error }, lookups] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .order("created_at", { ascending: true }),
    loadTaskLookups(),
  ]);
  if (error) {
    return { data: null, error: error.message };
  }
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  return {
    data: ((data ?? []) as TaskRow[]).map((row) =>
      toTaskSummary(row, lookups.data as TaskLookups)
    ),
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
  const total = children.reduce(
    (sum, child) => sum + effectiveTaskPercent(child, all),
    0
  );
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
  const total = topLevel.reduce(
    (sum, task) => sum + effectiveTaskPercent(task, all),
    0
  );
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
  const target = await resolveDisplayUuid("tasks", taskId, "Task");
  if (target.error || !target.data) {
    return { data: null, error: target.error ?? "Task tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data: rowData, error: rowError } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("id", target.data)
    .limit(1);
  if (rowError) {
    return { data: null, error: rowError.message };
  }
  const targetRow = ((rowData ?? []) as TaskRow[])[0];
  if (!targetRow) {
    return { data: null, error: "Task tidak ditemukan." };
  }
  if (!targetRow.start_date || Number.isNaN(Date.parse(newStartDate))) {
    return { data: null, error: "Task belum punya tanggal mulai." };
  }

  const project = await resolveDisplayUuid(
    "projects",
    targetRow.project_id,
    "Proyek"
  );
  if (project.error || !project.data) {
    return { data: null, error: project.error ?? "Proyek tidak ditemukan." };
  }

  const [allResult, lookups] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("project_id", project.data)
      .order("created_at", { ascending: true }),
    loadTaskLookups(),
  ]);
  if (allResult.error) {
    return { data: null, error: allResult.error.message };
  }
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat task." };
  }
  const all = ((allResult.data ?? []) as TaskRow[]).map((row) =>
    toTaskSummary(row, lookups.data as TaskLookups)
  );
  const working = new Map(all.map((task) => [task.id, { ...task }]));
  const targetTask = working.get(targetRow.display_id);
  if (!targetTask) {
    return { data: null, error: "Task tidak ditemukan." };
  }

  const shift = diffDays(targetTask.startDate as string, newStartDate);
  const changed: TaskSummary[] = [];
  const changedIds = new Set<string>();

  const shiftOne = (id: string, days: number) => {
    const item = working.get(id);
    if (!item || !item.startDate) {
      return;
    }
    item.startDate = shiftDateIso(item.startDate, days);
    if (item.targetDate) {
      item.targetDate = shiftDateIso(item.targetDate, days);
    }
    if (!changedIds.has(id)) {
      changedIds.add(id);
      changed.push({ ...item });
    } else {
      const index = changed.findIndex((entry) => entry.id === id);
      changed[index] = { ...item };
    }
  };
  shiftOne(targetRow.display_id, shift);

  // Kaskade FS: successor mulai paling cepat sehari setelah predecessor selesai.
  const { data: dependencies } = await listDependencies(
    lookups.data.projectMap.displayById.get(targetRow.project_id) ??
      targetRow.project_id
  );
  const queue = [targetRow.display_id];
  const visited = new Set([targetRow.display_id]);
  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const current = working.get(currentId);
    if (!current?.targetDate) {
      continue;
    }
    const minimumStart = shiftDateIso(current.targetDate, 1);
    for (const dependency of dependencies ?? []) {
      if (
        dependency.predecessorId !== currentId ||
        visited.has(dependency.successorId)
      ) {
        continue;
      }
      visited.add(dependency.successorId);
      const successor = working.get(dependency.successorId);
      if (successor?.startDate && successor.startDate <= current.targetDate) {
        const successorShift = diffDays(successor.startDate, minimumStart);
        shiftOne(dependency.successorId, successorShift);
        queue.push(dependency.successorId);
      }
    }
  }

  const taskIds = lookups.data.taskMap.idByDisplay;
  const now = new Date().toISOString();
  const updated = await Promise.all(
    changed.map((task) => {
      const id = taskIds.get(task.id);
      if (!id) {
        return Promise.resolve(null);
      }
      return supabase
        .from("tasks")
        .update({
          start_date: task.startDate ?? null,
          target_date: task.targetDate ?? null,
          updated_at: now,
        })
        .eq("id", id);
    })
  );
  const failure = updated.find((result) => result?.error);
  if (failure?.error) {
    return { data: null, error: failure.error.message };
  }
  return { data: changed, error: null };
}
