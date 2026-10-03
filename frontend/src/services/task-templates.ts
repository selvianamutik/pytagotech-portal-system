import { mockTaskTemplates } from "@/mocks/task-templates";
import { addTaskSummary } from "@/services/tasks";
import type { TaskSummary, TaskTemplate, TaskTemplateInput } from "@/types/task";
import type { ServiceResult } from "@/services/result";

/**
 * Template task standar + generator (US-021, FR-16).
 * Generate: task berurutan dari tanggal mulai proyek, durasi template
 * dijumlahkan (hari kalender; hari kerja di US-024).
 */

let templateStore: TaskTemplate[] = structuredClone(mockTaskTemplates);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockTaskTemplates(): void {
  templateStore = structuredClone(mockTaskTemplates);
}

export async function listTaskTemplates(): Promise<ServiceResult<TaskTemplate[]>> {
  return {
    data: [...templateStore]
      .sort((a, b) => a.order - b.order)
      .map((template) => ({ ...template })),
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
  if (!Number.isInteger(input.defaultDurationDays) || input.defaultDurationDays < 1) {
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
  const template: TaskTemplate = {
    id: `TPL-${String(templateStore.length + 1).padStart(3, "0")}`,
    name: input.name.trim(),
    order: input.order,
    defaultDurationDays: input.defaultDurationDays,
    isActive: input.isActive ?? true,
  };
  templateStore.push(template);
  return { data: { ...template }, error: null };
}

export async function updateTaskTemplate(
  templateId: string,
  input: TaskTemplateInput
): Promise<ServiceResult<TaskTemplate>> {
  const template = templateStore.find((item) => item.id === templateId);
  if (!template) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  const validationError = validateTemplateInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  template.name = input.name.trim();
  template.order = input.order;
  template.defaultDurationDays = input.defaultDurationDays;
  if (input.isActive !== undefined) {
    template.isActive = input.isActive;
  }
  return { data: { ...template }, error: null };
}

export async function deleteTaskTemplate(
  templateId: string
): Promise<ServiceResult<true>> {
  const index = templateStore.findIndex((item) => item.id === templateId);
  if (index === -1) {
    return { data: null, error: "Template tidak ditemukan." };
  }
  templateStore.splice(index, 1);
  return { data: true, error: null };
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Generate task proyek dari template aktif, berurutan dari tanggal mulai.
 * Dipanggil otomatis oleh createProjectFromHandover (US-019).
 */
export async function generateTasksForProject(
  projectId: string,
  projectStartDate: string
): Promise<ServiceResult<TaskSummary[]>> {
  const { data: templates } = await listTaskTemplates();
  const active = (templates ?? []).filter((template) => template.isActive);
  const generated: TaskSummary[] = [];
  let cursor = projectStartDate;
  for (const template of active) {
    const start = cursor;
    const target = addDays(start, template.defaultDurationDays - 1);
    const { data } = await addTaskSummary({
      projectId,
      title: template.name,
      percent: 0,
      startDate: start,
      targetDate: target,
      isActive: true,
    });
    if (data) {
      generated.push(data);
    }
    cursor = addDays(target, 1);
  }
  return { data: generated, error: null };
}
