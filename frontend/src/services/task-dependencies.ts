import type { ServiceResult } from "@/services/result";

/**
 * Dependensi antar-task finish-to-start (US-025, FR-19).
 * Fase 1: mock; Fase 2: tabel `task_dependencies`.
 */
export interface TaskDependency {
  id: string;
  projectId: string;
  predecessorId: string;
  successorId: string;
}

let dependencyStore: TaskDependency[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockDependencies(): void {
  dependencyStore = [];
}

export async function listDependencies(
  projectId: string
): Promise<ServiceResult<TaskDependency[]>> {
  return {
    data: dependencyStore
      .filter((dependency) => dependency.projectId === projectId)
      .map((dependency) => ({ ...dependency })),
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
    return { data: null, error: "Task tidak dapat bergantung pada dirinya sendiri." };
  }
  if (
    dependencyStore.some(
      (dependency) =>
        dependency.projectId === projectId &&
        dependency.predecessorId === predecessorId &&
        dependency.successorId === successorId
    )
  ) {
    return { data: null, error: "Dependensi sudah ada." };
  }
  // Tolak siklus: successor tidak boleh (transitif) mendahului predecessor.
  const reaches = (from: string, target: string, visited: Set<string>): boolean => {
    if (from === target) {
      return true;
    }
    if (visited.has(from)) {
      return false;
    }
    visited.add(from);
    return dependencyStore
      .filter(
        (dependency) => dependency.projectId === projectId && dependency.predecessorId === from
      )
      .some((dependency) => reaches(dependency.successorId, target, visited));
  };
  if (reaches(successorId, predecessorId, new Set())) {
    return { data: null, error: "Dependensi membentuk siklus." };
  }
  const dependency: TaskDependency = {
    id: `DEP-${String(dependencyStore.length + 1).padStart(3, "0")}`,
    projectId,
    predecessorId,
    successorId,
  };
  dependencyStore.push(dependency);
  return { data: { ...dependency }, error: null };
}

export async function removeDependency(
  dependencyId: string
): Promise<ServiceResult<true>> {
  const index = dependencyStore.findIndex((item) => item.id === dependencyId);
  if (index === -1) {
    return { data: null, error: "Dependensi tidak ditemukan." };
  }
  dependencyStore.splice(index, 1);
  return { data: true, error: null };
}
