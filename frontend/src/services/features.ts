import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import {
  loadDisplayMap,
  loadMemberMaps,
  resolveDisplayUuid,
} from "@/services/production-refs";
import { addTaskSummary } from "@/services/tasks";
import type {
  FeatureInput,
  FeaturePriority,
  ProjectFeature,
} from "@/types/feature";
import { isFeaturePriority } from "@/types/feature";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan backlog fitur (US-023). Fitur handover masuk otomatis saat proyek
 * dibuat lewat RPC (idempoten); fitur dapat diubah menjadi task.
 *
 * Database-backed: `features` menyimpan kategori/prioritas master, developer
 * (`team_members`), estimasi, sumber, jadwal otomatis, dan override beralasan.
 */

interface FeatureRow {
  id: string;
  display_id: string;
  project_id: string;
  name: string;
  category: string;
  priority: string;
  developer_id: string | null;
  estimate_days: number | string;
  source: string;
  task_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  override_start: string | null;
  override_end: string | null;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
}

const FEATURE_COLUMNS =
  "id, display_id, project_id, name, category, priority, developer_id, estimate_days, source, task_id, scheduled_start, scheduled_end, override_start, override_end, override_reason, created_at, updated_at";

interface FeatureLookups {
  projectMap: NonNullable<
    Awaited<ReturnType<typeof loadDisplayMap>>["data"]
  >;
  memberMap: NonNullable<Awaited<ReturnType<typeof loadMemberMaps>>["data"]>;
  taskMap: NonNullable<Awaited<ReturnType<typeof loadDisplayMap>>["data"]>;
}

/** Backward-compat no-op untuk test runner. */
export function resetMockFeatures(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
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

async function loadFeatureLookups(): Promise<ServiceResult<FeatureLookups>> {
  const [projectMap, memberMap, taskMap] = await Promise.all([
    loadDisplayMap("projects"),
    loadMemberMaps(),
    loadDisplayMap("tasks"),
  ]);
  const error = projectMap.error ?? memberMap.error ?? taskMap.error;
  if (error || !projectMap.data || !memberMap.data || !taskMap.data) {
    return { data: null, error: error ?? "Gagal memuat relasi fitur." };
  }
  return {
    data: {
      projectMap: projectMap.data,
      memberMap: memberMap.data,
      taskMap: taskMap.data,
    },
    error: null,
  };
}

function toFeature(row: FeatureRow, lookups: FeatureLookups): ProjectFeature {
  const override =
    row.override_start && row.override_end
      ? {
          startDate: row.override_start,
          endDate: row.override_end,
          reason: row.override_reason ?? "",
        }
      : undefined;
  return {
    id: row.display_id,
    projectId:
      lookups.projectMap.displayById.get(row.project_id) ?? row.project_id,
    name: row.name,
    category: row.category,
    priority: row.priority as FeaturePriority,
    developer: row.developer_id
      ? lookups.memberMap.nameById.get(row.developer_id) ?? ""
      : "",
    estimateDays: Number(row.estimate_days),
    source: row.source === "handover" ? "handover" : "manual",
    taskId: row.task_id
      ? lookups.taskMap.displayById.get(row.task_id) ?? row.task_id
      : undefined,
    scheduledStart: row.scheduled_start ?? undefined,
    scheduledEnd: row.scheduled_end ?? undefined,
    scheduleOverride: override,
    createdAt: row.created_at,
  };
}

async function resolveDeveloperId(
  developer: string
): Promise<ServiceResult<string | null>> {
  if (!developer.trim()) {
    return { data: null, error: null };
  }
  const members = await loadMemberMaps();
  if (members.error || !members.data) {
    return { data: null, error: members.error ?? "Gagal memuat data tim." };
  }
  const id = members.data.idByName.get(developer.trim());
  if (!id) {
    return { data: null, error: "Developer tidak dikenal." };
  }
  return { data: id, error: null };
}

export async function listFeatures(
  projectId: string
): Promise<ServiceResult<ProjectFeature[]>> {
  const project = await resolveDisplayUuid("projects", projectId, "Proyek");
  if (project.error || !project.data) {
    return { data: [], error: null };
  }
  const supabase = getSupabaseClient();
  const [{ data, error }, lookups] = await Promise.all([
    supabase
      .from("features")
      .select(FEATURE_COLUMNS)
      .eq("project_id", project.data)
      .order("created_at", { ascending: true }),
    loadFeatureLookups(),
  ]);
  if (error) {
    return { data: null, error: error.message };
  }
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  return {
    data: ((data ?? []) as FeatureRow[]).map((row) =>
      toFeature(row, lookups.data as FeatureLookups)
    ),
    error: null,
  };
}

/** Seluruh fitur lintas proyek (kalender universal). */
export async function listAllFeatures(): Promise<ServiceResult<ProjectFeature[]>> {
  const supabase = getSupabaseClient();
  const [{ data, error }, lookups] = await Promise.all([
    supabase
      .from("features")
      .select(FEATURE_COLUMNS)
      .order("created_at", { ascending: true }),
    loadFeatureLookups(),
  ]);
  if (error) {
    return { data: null, error: error.message };
  }
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  return {
    data: ((data ?? []) as FeatureRow[]).map((row) =>
      toFeature(row, lookups.data as FeatureLookups)
    ),
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
  const project = await resolveDisplayUuid("projects", projectId, "Proyek");
  if (project.error || !project.data) {
    return { data: null, error: project.error ?? "Proyek tidak ditemukan." };
  }
  const developer = await resolveDeveloperId(input.developer);
  if (developer.error) {
    return { data: null, error: developer.error };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("features")
    .insert({
      project_id: project.data,
      name: input.name.trim(),
      category: input.category.trim(),
      priority: input.priority,
      developer_id: developer.data,
      estimate_days: input.estimateDays,
      source: "manual",
    })
    .select(FEATURE_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as FeatureRow[])[0];
  if (!row) {
    return { data: null, error: "Fitur gagal dibuat." };
  }
  const lookups = await loadFeatureLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  return { data: toFeature(row, lookups.data), error: null };
}

export async function updateFeature(
  featureId: string,
  input: FeatureInput
): Promise<ServiceResult<ProjectFeature>> {
  const validationError = validateFeatureInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const feature = await resolveDisplayUuid("features", featureId, "Fitur");
  if (feature.error || !feature.data) {
    return { data: null, error: feature.error ?? "Fitur tidak ditemukan." };
  }
  const developer = await resolveDeveloperId(input.developer);
  if (developer.error) {
    return { data: null, error: developer.error };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("features")
    .update({
      name: input.name.trim(),
      category: input.category.trim(),
      priority: input.priority,
      developer_id: developer.data,
      estimate_days: input.estimateDays,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feature.data)
    .select(FEATURE_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as FeatureRow[])[0];
  if (!row) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  const lookups = await loadFeatureLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  return { data: toFeature(row, lookups.data), error: null };
}

export async function deleteFeature(
  featureId: string
): Promise<ServiceResult<true>> {
  const feature = await resolveDisplayUuid("features", featureId, "Fitur");
  if (feature.error || !feature.data) {
    return { data: null, error: feature.error ?? "Fitur tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("features")
    .delete()
    .eq("id", feature.data)
    .select("id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  return { data: true, error: null };
}

/**
 * Impor fitur dari handover tertaut (idempoten). RPC pembuatan proyek sudah
 * menyalin fitur; fungsi ini menambal proyek lama atau hasil impor manual.
 */
export async function ensureBacklogFromHandover(
  projectId: string,
  handoverId: string
): Promise<ServiceResult<ProjectFeature[]>> {
  const [project, deal] = await Promise.all([
    resolveDisplayUuid("projects", projectId, "Proyek"),
    resolveDisplayUuid("deals", handoverId, "Deal handover"),
  ]);
  if (project.error || !project.data) {
    return { data: null, error: project.error ?? "Proyek tidak ditemukan." };
  }
  if (deal.error || !deal.data) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }

  const supabase = getSupabaseClient();
  const [dealFeaturesResult, existingResult] = await Promise.all([
    supabase
      .from("deal_features")
      .select("name")
      .eq("deal_id", deal.data)
      .order("name", { ascending: true }),
    supabase.from("features").select("name").eq("project_id", project.data),
  ]);
  if (dealFeaturesResult.error) {
    return { data: null, error: dealFeaturesResult.error.message };
  }
  if (existingResult.error) {
    return { data: null, error: existingResult.error.message };
  }
  const existing = new Set(
    ((existingResult.data ?? []) as { name: string }[]).map((row) =>
      row.name.trim().toLowerCase()
    )
  );
  const rows = ((dealFeaturesResult.data ?? []) as { name: string }[])
    .filter((row) => !existing.has(row.name.trim().toLowerCase()))
    .map((row) => ({
      project_id: project.data,
      name: row.name.trim(),
      category: "Backend",
      priority: "Medium",
      estimate_days: DEFAULT_IMPORT_ESTIMATE_DAYS,
      source: "handover",
    }));
  if (rows.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("features")
    .insert(rows)
    .select(FEATURE_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const lookups = await loadFeatureLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  return {
    data: ((data ?? []) as FeatureRow[]).map((row) =>
      toFeature(row, lookups.data as FeatureLookups)
    ),
    error: null,
  };
}

/**
 * Ubah fitur menjadi task proyek (US-023). Task mewarisi nama, developer,
 * dan estimasi sebagai catatan awal.
 */
export async function convertFeatureToTask(
  featureId: string
): Promise<ServiceResult<{ taskId: string }>> {
  const feature = await resolveDisplayUuid("features", featureId, "Fitur");
  if (feature.error || !feature.data) {
    return { data: null, error: feature.error ?? "Fitur tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data: rowData, error: rowError } = await supabase
    .from("features")
    .select(FEATURE_COLUMNS)
    .eq("id", feature.data)
    .limit(1);
  if (rowError) {
    return { data: null, error: rowError.message };
  }
  const row = ((rowData ?? []) as FeatureRow[])[0];
  if (!row) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  if (row.task_id) {
    return { data: null, error: "Fitur ini sudah dijadikan task." };
  }
  const lookups = await loadFeatureLookups();
  if (lookups.error || !lookups.data) {
    return { data: null, error: lookups.error ?? "Gagal memuat fitur." };
  }
  const projectDisplay =
    lookups.data.projectMap.displayById.get(row.project_id) ?? row.project_id;
  const developerName = row.developer_id
    ? lookups.data.memberMap.nameById.get(row.developer_id)
    : undefined;

  const { data: task, error } = await addTaskSummary({
    projectId: projectDisplay,
    title: row.name,
    assignee: developerName,
    notes: `Dari backlog ${row.display_id} (estimasi ${row.estimate_days} hari).`,
  });
  if (error || !task) {
    return { data: null, error: error ?? "Gagal membuat task." };
  }

  const taskUuid = await resolveDisplayUuid("tasks", task.id, "Task");
  if (taskUuid.error || !taskUuid.data) {
    return { data: null, error: taskUuid.error ?? "Gagal menautkan task." };
  }
  const { data: updated, error: updateError } = await supabase
    .from("features")
    .update({ task_id: taskUuid.data })
    .eq("id", row.id)
    .select("id");
  if (updateError) {
    return { data: null, error: updateError.message };
  }
  if (!updated || updated.length === 0) {
    return { data: null, error: "Gagal menautkan task ke fitur." };
  }
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
  const feature = await resolveDisplayUuid("features", featureId, "Fitur");
  if (feature.error || !feature.data) {
    return { data: null, error: feature.error ?? "Fitur tidak ditemukan." };
  }
  const patch: Record<string, unknown> = {
    scheduled_start: schedule.startDate,
    scheduled_end: schedule.endDate,
    updated_at: new Date().toISOString(),
  };
  if (schedule.markOverridden) {
    patch.override_start = schedule.startDate;
    patch.override_end = schedule.endDate;
    patch.override_reason = schedule.overrideReason ?? "";
  } else if (!schedule.overrideReason) {
    patch.override_start = null;
    patch.override_end = null;
    patch.override_reason = null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("features")
    .update(patch)
    .eq("id", feature.data)
    .select("id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Fitur tidak ditemukan." };
  }
  return { data: true, error: null };
}
