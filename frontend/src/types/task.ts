/**
 * Kontrak Task (dibangun bertahap: US-020 membawa store minimal +
 * rollup progress; field penuh di US-022).
 */

/** Status task sesuai PRD US-022. */
export const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Blocked",
  "Review",
  "Done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskSummary {
  id: string;
  projectId: string;
  title: string;
  /** 0–100. Untuk induk, dihitung dari sub-task (US-022). */
  percent: number;
  parentId?: string;
  /** Tanggal mulai (YYYY-MM-DD, diisi generator US-021). */
  startDate?: string;
  /** Target selesai (YYYY-MM-DD, diisi generator US-021). */
  targetDate?: string;
  /** Penanggung jawab (nama user). */
  assignee?: string;
  /** Task nonaktif disembunyikan dari board (US-021). */
  isActive?: boolean;
  status: TaskStatus;
  /** Catatan task. */
  notes?: string;
  /** Lampiran/link pendukung (URL atau teks). */
  link?: string;
}

export interface TaskInput {
  title?: string;
  assignee?: string;
  status?: TaskStatus;
  startDate?: string;
  targetDate?: string;
  percent?: number;
  notes?: string;
  link?: string;
  parentId?: string;
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

/**
 * Template task standar (US-021, FR-16).
 * Urutan resmi: RAD → PUS → SAD; masing-masing tiga hari kerja (Q-005).
 */
export interface TaskTemplate {
  id: string;
  name: string;
  order: number;
  /** Durasi default dalam hari kalender. */
  defaultDurationDays: number;
  isActive: boolean;
}

export interface TaskTemplateInput {
  name: string;
  order: number;
  defaultDurationDays: number;
  isActive?: boolean;
}
