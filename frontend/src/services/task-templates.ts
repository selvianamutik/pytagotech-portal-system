import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { addTaskSummary } from "@/services/tasks";
import { addWorkdays, getScheduleSettings, nextWorkday } from "@/services/scheduling";
import type { TaskSummary, TaskTemplate, TaskTemplateInput } from "@/types/task";
import type { ServiceResult } from "@/services/result";

/**
 * Template task standar + generator (US-021, FR-16).
 * Generate: task berurutan dari tanggal mulai proyek, durasi template
 * dijumlahkan. Pembuatan proyek dari handover memakai RPC database yang juga
 * membaca template aktif; service ini dipakai untuk CRUD Admin dan generator
 * manual pada proyek yang sudah ada.
 *
 * Urutan template resmi adalah RAD → PUS → SAD (Q-005), masing-masing tiga
 * hari kerja.
 */

interface TemplateRow {
  id: string;
  name: string;
  ord: number | string;
  duration_days: number | string;
  is_active: boolean;
}

const TEMPLATE_COLUMNS = "id, name, ord, duration_days, is_active";

/** Backward-compat no-op untuk test runner. */
export function resetMockTaskTemplates(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

function toTemplate(row: TemplateRow): TaskTemplate {
  return {
    id: row.id,
    name: row.name,
    order: Number(row.ord),
    defaultDurationDays: Number(row.duration_days),
    isActive: row.is_active,
  };
}

function wasDisplayTemplateId(templateId: string): boolean {
  // ID template tidak punya display ID; ID lama (`TPL-xxx`) hanya ada di mock.
  return /^TPL-\d+$/.test(templateId);
}

export async function listTaskTemplates(): Promise<ServiceResult<TaskTemplate[]>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_templates")
    .select(TEMPLATE_COLUMNS)
    .order("ord", { ascending: true });
  if (error) {
    return { data: null, error: error.message };
  }
  return {
    data: ((data ?? []) as TemplateRow[]).map(toTemplate),
    error: null,
  };
}

function validateTemplateInput(input: TaskTemplateInput): string | null {
  if (input.name.trim().length === 0) {
    return "Nama aktivitas wajib diisi.";
  }
  if (!Number.isInteger(input.order) || input.order < 1) {
    return "Urutan harus bilangan bulat ≥ 1.";
  }
  if (
    !Number.isInteger(input.defaultDurationDays) ||
    input.defaultDurationDays < 1
  ) {
    return "Durasi default harus bilangan bulat ≥ 1 hari.";
  }
  return null;
}

export async function createTaskTemplate(
  input: TaskTemplateInput
): Promise<ServiceResult<TaskTemplate>> {
  const validationError = validateTemplateInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_templates")
    .insert({
      name: input.name.trim(),
      ord: input.order,
      duration_days: input.defaultDurationDays,
      is_active: input.isActive ?? true,
    })
    .select(TEMPLATE_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as TemplateRow[])[0];
  if (!row) {
    return { data: null, error: "Template gagal dibuat." };
  }
  return { data: toTemplate(row), error: null };
}

export async function updateTaskTemplate(
  templateId: string,
  input: TaskTemplateInput
): Promise<ServiceResult<TaskTemplate>> {
  if (wasDisplayTemplateId(templateId)) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  const validationError = validateTemplateInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const patch: Record<string, unknown> = {
    name: input.name.trim(),
    ord: input.order,
    duration_days: input.defaultDurationDays,
  };
  if (input.isActive !== undefined) {
    patch.is_active = input.isActive;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_templates")
    .update(patch)
    .eq("id", templateId)
    .select(TEMPLATE_COLUMNS);
  if (error) {
    return { data: null, error: error.message };
  }
  const row = ((data ?? []) as TemplateRow[])[0];
  if (!row) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  return { data: toTemplate(row), error: null };
}

export async function deleteTaskTemplate(
  templateId: string
): Promise<ServiceResult<true>> {
  if (wasDisplayTemplateId(templateId)) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("task_templates")
    .delete()
    .eq("id", templateId)
    .select("id");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || data.length === 0) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  return { data: true, error: null };
}

/**
 * Generate task proyek dari template aktif, berurutan dari tanggal mulai.
 * RPC `create_project_from_handover` melakukan hal setara secara atomik;
 * fungsi ini untuk proyek yang sudah ada / penambahan manual.
 */
export async function generateTasksForProject(
  projectId: string,
  projectStartDate: string
): Promise<ServiceResult<TaskSummary[]>> {
  const templatesResult = await listTaskTemplates();
  if (templatesResult.error || !templatesResult.data) {
    return {
      data: null,
      error: templatesResult.error ?? "Gagal memuat template.",
    };
  }
  const scheduleSettings = await getScheduleSettings();
  if (scheduleSettings.error || !scheduleSettings.data) {
    return {
      data: null,
      error: scheduleSettings.error ?? "Gagal memuat hari libur.",
    };
  }
  const active = templatesResult.data.filter((template) => template.isActive);
  const generated: TaskSummary[] = [];
  const holidays = scheduleSettings.data.holidays;
  let cursor = nextWorkday(projectStartDate, holidays);
  for (const template of active) {
    const start = nextWorkday(cursor, holidays);
    const target = addWorkdays(start, template.defaultDurationDays - 1, holidays);
    const { data, error } = await addTaskSummary({
      projectId,
      title: template.name,
      percent: 0,
      startDate: start,
      targetDate: target,
      isActive: true,
    });
    if (error || !data) {
      return { data: null, error: error ?? "Gagal membuat task." };
    }
    generated.push(data);
    cursor = addWorkdays(target, 1, holidays);
  }
  return { data: generated, error: null };
}
