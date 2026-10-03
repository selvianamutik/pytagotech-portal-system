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
}
