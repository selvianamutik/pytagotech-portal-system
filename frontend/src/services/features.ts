import { getDeal } from "@/services/deals";
import { addTaskSummary } from "@/services/tasks";
import type { FeatureInput, ProjectFeature } from "@/types/feature";
import { isFeaturePriority } from "@/types/feature";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan backlog fitur (US-023). Fitur handover masuk otomatis
 * saat proyek dibuat (idempoten); fitur dapat diubah menjadi task.
 */

let featureStore: ProjectFeature[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockFeatures(): void {
  featureStore = [];
}

/** Estimasi default impor handover — PM menyesuaikan (lihat US-024). */
const DEFAULT_IMPORT_ESTIMATE_DAYS = 1;

function validateFeatureInput(input: FeatureInput): string | null {
  if (input.name.trim().length === 0) {
    return "Nama fitur wajib diisi.";
  }
  if (input.category.trim().length === 0) {
    return "Kategori wajib diisi.";
  }
  if (!isFeaturePriority(input.priority)) {
    return "Prioritas harus High, Medium, atau Low.";
  }
  if (!Number.isInteger(input.estimateDays) || input.estimateDays < 1) {
    return "Estimasi harus bilangan bulat ≥ 1 hari.";
  }
  return null;
}

export async function listFeatures(
  projectId: string
): Promise<ServiceResult<ProjectFeature[]>> {
  return {
    data: featureStore
      .filter((feature) => feature.projectId === projectId)
      .map((feature) => ({ ...feature })),
    error: null,
  };
}

export async function createFeature(
  projectId: string,
  input: FeatureInput
): Promise<ServiceResult<ProjectFeature>> {
  const validationError = validateFeatureInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const feature: ProjectFeature = {
    id: `FIT-${String(featureStore.length + 1).padStart(3, "0")}`,
    projectId,
    name: input.name.trim(),
    category: input.category.trim(),
    priority: input.priority,
    developer: input.developer.trim(),
    estimateDays: input.estimateDays,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  featureStore.push(feature);
  return { data: { ...feature }, error: null };
}

export async function updateFeature(
  featureId: string,
  input: FeatureInput
): Promise<ServiceResult<ProjectFeature>> {
  const feature = featureStore.find((item) => item.id === featureId);
  if (!feature) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  const validationError = validateFeatureInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  feature.name = input.name.trim();
  feature.category = input.category.trim();
  feature.priority = input.priority;
  feature.developer = input.developer.trim();
  feature.estimateDays = input.estimateDays;
  return { data: { ...feature }, error: null };
}

export async function deleteFeature(featureId: string): Promise<ServiceResult<true>> {
  const index = featureStore.findIndex((item) => item.id === featureId);
  if (index === -1) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  featureStore.splice(index, 1);
  return { data: true, error: null };
}

/**
 * Impor fitur dari handover tertaut (otomatis saat proyek dibuat).
 * Idempoten: fitur bernama sama tidak diimpor ulang.
 */
export async function ensureBacklogFromHandover(
  projectId: string,
  handoverId: string
): Promise<ServiceResult<ProjectFeature[]>> {
  const { data: found } = await getDeal(handoverId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  const existing = new Set(
    featureStore
      .filter((feature) => feature.projectId === projectId)
      .map((feature) => feature.name.toLowerCase())
  );
  const imported: ProjectFeature[] = [];
  for (const item of found.deal.features) {
    if (existing.has(item.name.trim().toLowerCase())) {
      continue;
    }
    const feature: ProjectFeature = {
      id: `FIT-${String(featureStore.length + 1).padStart(3, "0")}`,
      projectId,
      name: item.name.trim(),
      category: "Handover",
      priority: "Medium",
      developer: "",
      estimateDays: DEFAULT_IMPORT_ESTIMATE_DAYS,
      source: "handover",
      createdAt: new Date().toISOString(),
    };
    featureStore.push(feature);
    imported.push({ ...feature });
  }
  return { data: imported, error: null };
}

/**
 * Ubah fitur menjadi task proyek (US-023). Task mewarisi nama, * developer, dan estimasi sebagai catatan awal.
 */
export async function convertFeatureToTask(
  featureId: string
): Promise<ServiceResult<{ taskId: string }>> {
  const feature = featureStore.find((item) => item.id === featureId);
  if (!feature) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  if (feature.taskId) {
    return { data: null, error: "Fitur ini sudah dijadikan task." };
  }
  const { data: task, error } = await addTaskSummary({
    projectId: feature.projectId,
    title: feature.name,
    assignee: feature.developer || undefined,
    notes: `Dari backlog ${feature.id} (estimasi ${feature.estimateDays} hari).`,
  });
  if (error || !task) {
    return { data: null, error: error ?? "Gagal membuat task." };
  }
  feature.taskId = task.id;
  return { data: { taskId: task.id }, error: null };
}

export interface WriteScheduleInput {
  startDate: string;
  endDate: string;
  /** Alasan override (null = jadwal otomatis). */
  overrideReason: string | null;
  markOverridden?: boolean;
}

/** Tulis hasil penjadwalan ke fitur (dipakai US-024; dibaca Gantt US-025). */
export async function writeFeatureSchedule(
  featureId: string,
  schedule: WriteScheduleInput
): Promise<ServiceResult<true>> {
  const feature = featureStore.find((item) => item.id === featureId);
  if (!feature) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  feature.scheduledStart = schedule.startDate;
  feature.scheduledEnd = schedule.endDate;
  if (schedule.markOverridden) {
    feature.scheduleOverride = {
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      reason: schedule.overrideReason ?? "",
    };
  } else if (!schedule.overrideReason) {
    feature.scheduleOverride = undefined;
  }
  return { data: true, error: null };
}
