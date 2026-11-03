import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { resolveDisplayUuid } from "@/services/production-refs";
import type { ServiceResult } from "@/services/result";

/**
 * Dependensi antar-task finish-to-start (US-025, FR-19).
 *
 * Tabel `task_dependencies` memakai composite primary key
 * `(predecessor_id, successor_id)` tanpa kolom `id`. UI tetap memakai ID
 * sintetis `PRED->SUCC` (display ID) agar dapat menghapus satu relasi.
 */
export interface TaskDependency {
  id: string;
  projectId: string;
  predecessorId: string;
  successorId: string;
}

interface DependencyRow {
  predecessor_id: string;
  successor_id: string;
}

interface TaskMapContext {
  taskIdByDisplay: Map<string, string>;
  taskDisplayById: Map<string, string>;
}

/** Backward-compat no-op untuk test runner. */
export function resetMockDependencies(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

async function loadTaskContext(
  projectId: string
): Promise<ServiceResult<TaskMapContext>> {
  const project = await resolveDisplayUuid("projects", projectId, "Proyek");
  if (project.error || !project.data) {
    return { data: null, error: project.error ?? "Proyek tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, display_id")
    .eq("project_id", project.data);
  if (error) {
    return { data: null, error: error.message };
  }
  const taskIdByDisplay = new Map<string, string>();
  const taskDisplayById = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; display_id: string }[]) {
    taskIdByDisplay.set(row.display_id, row.id);
    taskDisplayById.set(row.id, row.display_id);
  }
  return { data: { taskIdByDisplay, taskDisplayById }, error: null };
}

async function fetchDependencyRows(
  taskIds: string[]
): Promise<ServiceResult<DependencyRow[]>> {
  if (taskIds.length === 0) {
    return { data: [], error: null };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_dependencies")
    .select("predecessor_id, successor_id")
    .in("predecessor_id", taskIds);
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: (data ?? []) as DependencyRow[], error: null };
}

export async function listDependencies(
  projectId: string
): Promise<ServiceResult<TaskDependency[]>> {
  const context = await loadTaskContext(projectId);
  if (context.error || !context.data) {
    // Proyek belum punya task/dependensi ditampilkan kosong.
    return { data: [], error: null };
  }
  const rows = await fetchDependencyRows([...context.data.taskIdByDisplay.values()]);
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error ?? "Gagal memuat dependensi." };
  }
  return {
    data: rows.data
      .map((row) => {
        const predecessorId = context.data!.taskDisplayById.get(
          row.predecessor_id
        );
        const successorId = context.data!.taskDisplayById.get(row.successor_id);
        if (!predecessorId || !successorId) {
          return null;
        }
        return {
          id: `${predecessorId}->${successorId}`,
          projectId,
          predecessorId,
          successorId,
        };
      })
      .filter((row): row is TaskDependency => row !== null),
    error: null,
  };
}

/** Tambah relasi FS; menolak siklus dan duplikat. */
export async function addDependency(
  projectId: string,
  predecessorId: string,
  successorId: string
): Promise<ServiceResult<TaskDependency>> {
  if (predecessorId === successorId) {
    return {
      data: null,
      error: "Task tidak dapat bergantung pada dirinya sendiri.",
    };
  }
  const context = await loadTaskContext(projectId);
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Proyek tidak ditemukan." };
  }
  const predecessorUuid = context.data.taskIdByDisplay.get(predecessorId);
  const successorUuid = context.data.taskIdByDisplay.get(successorId);
  if (!predecessorUuid || !successorUuid) {
    return {
      data: null,
      error: "Kedua task harus berada di proyek yang sama.",
    };
  }

  const existing = await fetchDependencyRows([
    ...context.data.taskIdByDisplay.values(),
  ]);
  if (existing.error || !existing.data) {
    return {
      data: null,
      error: existing.error ?? "Gagal memeriksa dependensi.",
    };
  }
  if (
    existing.data.some(
      (row) =>
        row.predecessor_id === predecessorUuid &&
        row.successor_id === successorUuid
    )
  ) {
    return { data: null, error: "Dependensi sudah ada." };
  }

  // Tolak siklus: successor tidak boleh (transitif) mendahului predecessor.
  const adjacency = new Map<string, string[]>();
  for (const row of existing.data) {
    const list = adjacency.get(row.predecessor_id) ?? [];
    list.push(row.successor_id);
    adjacency.set(row.predecessor_id, list);
  }
  const reaches = (
    from: string,
    target: string,
    visited: Set<string>
  ): boolean => {
    if (from === target) {
      return true;
    }
    if (visited.has(from)) {
      return false;
    }
    visited.add(from);
    return (adjacency.get(from) ?? []).some((next) =>
      reaches(next, target, visited)
    );
  };
  if (reaches(successorUuid, predecessorUuid, new Set())) {
    return { data: null, error: "Dependensi membentuk siklus." };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("task_dependencies").insert({
    predecessor_id: predecessorUuid,
    successor_id: successorUuid,
  });
  if (error) {
    return { data: null, error: error.message };
  }
  return {
    data: {
      id: `${predecessorId}->${successorId}`,
      projectId,
      predecessorId,
      successorId,
    },
    error: null,
  };
}

export async function removeDependency(
  dependencyId: string
): Promise<ServiceResult<true>> {
  const [predecessorDisplay, successorDisplay] = dependencyId.split("->");
  if (!predecessorDisplay || !successorDisplay) {
    return { data: null, error: "Dependensi tidak ditemukan." };
  }
  const [predecessor, successor] = await Promise.all([
    resolveDisplayUuid("tasks", predecessorDisplay, "Task"),
    resolveDisplayUuid("tasks", successorDisplay, "Task"),
  ]);
  if (
    predecessor.error ||
    successor.error ||
    !predecessor.data ||
    !successor.data
  ) {
    return { data: null, error: "Dependensi tidak ditemukan." };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("predecessor_id", predecessor.data)
    .eq("successor_id", successor.data)
    .select("predecessor_id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Dependensi tidak ditemukan." };
  }
  return { data: true, error: null };
}
