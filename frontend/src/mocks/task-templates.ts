import type { TaskTemplate } from "@/types/task";

/**
 * Seed template task — PLACEHOLDER sampai Q-005 dijawab.
 * Q-005 meminta daftar standar (nama, urutan, durasi) dari tim Produksi.
 * Mekanisme CRUD + generate sudah final; hanya isi yang menunggu.
 */
export const mockTaskTemplates: TaskTemplate[] = [
  { id: "TPL-001", name: "Kickoff & brief internal", order: 1, defaultDurationDays: 2, isActive: true },
  { id: "TPL-002", name: "Pengerjaan utama", order: 2, defaultDurationDays: 10, isActive: true },
  { id: "TPL-003", name: "Review & revisi", order: 3, defaultDurationDays: 3, isActive: true },
  { id: "TPL-004", name: "Serah terima", order: 4, defaultDurationDays: 1, isActive: true },
];
