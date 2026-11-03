import type { TaskTemplate } from "@/types/task";

/**
 * Seed template task resmi (Q-005, 2026-11-03).
 */
export const mockTaskTemplates: TaskTemplate[] = [
  { id: "TPL-001", name: "Pembuatan dokumen RAD", order: 1, defaultDurationDays: 3, isActive: true },
  { id: "TPL-002", name: "Pembuatan dokumen PUS", order: 2, defaultDurationDays: 3, isActive: true },
  { id: "TPL-003", name: "Pembuatan dokumen SAD", order: 3, defaultDurationDays: 3, isActive: true },
];
