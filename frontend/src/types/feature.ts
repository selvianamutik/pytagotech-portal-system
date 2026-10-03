/**
 * Kontrak backlog fitur per proyek (US-023).
 * Penjadwalan (tanggal, bentrok, override) menyusul di US-024.
 * Fase 1: mock; Fase 2: tabel `features`.
 */
export const FEATURE_PRIORITIES = ["High", "Medium", "Low"] as const;

export type FeaturePriority = (typeof FEATURE_PRIORITIES)[number];

export interface ProjectFeature {
  /** Display ID (FIT-xxx). */
  id: string;
  projectId: string;
  name: string;
  /** Kategori bebas (kandidat master data US-005). */
  category: string;
  priority: FeaturePriority;
  developer: string;
  /** Estimasi hari kerja. */
  estimateDays: number;
  /** Sumber: handover (otomatis) atau manual. */
  source: "handover" | "manual";
  /** Task hasil konversi (US-023: fitur → task). */
  taskId?: string;
  /** Jadwal otomatis (US-024, YYYY-MM-DD). */
  scheduledStart?: string;
  scheduledEnd?: string;
  /** Override manual + alasan (US-024). */
  scheduleOverride?: { startDate: string; endDate: string; reason: string };
  createdAt: string;
}

export interface FeatureInput {
  name: string;
  category: string;
  priority: FeaturePriority;
  developer: string;
  estimateDays: number;
}

export function isFeaturePriority(value: string): value is FeaturePriority {
  return (FEATURE_PRIORITIES as readonly string[]).includes(value);
}
