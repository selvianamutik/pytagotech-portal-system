/**
 * Kontrak Task (dibangun bertahap: US-020 membawa store minimal +
 * rollup progress; field penuh di US-022).
 */
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
}

/**
 * Template task standar (US-021, FR-16).
 * Isi seed = placeholder sampai Q-005 dijawab tim Produksi.
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
