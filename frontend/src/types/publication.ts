import type { SosmedPlatform } from "@/types/sosmed";

/**
 * Kontrak publikasi distribusi (US-031 s.d. US-033, FR-23, FR-24).
 * Satu MAT-xxxx → banyak PUB-xxxx, pola Single/Crosspost.
 * Rilis aktual (US-033) dan metrik (US-035) menempel di tipe ini.
 * Fase 1: mock; Fase 2: tabel `publications`.
 */

/** Pola distribusi sesuai PRD US-031. */
export const DISTRIBUTION_PATTERNS = ["Single", "Crosspost"] as const;

export type DistributionPattern = (typeof DISTRIBUTION_PATTERNS)[number];

export interface Publication {
  /** Display ID PUB-xxxx otomatis. */
  id: string;
  materialId: string;
  platform: SosmedPlatform;
  pattern: DistributionPattern;
  /** Jadwal tayang publikasi (YYYY-MM-DD, warisan materi, bisa digeser). */
  scheduleDate?: string;
  /** Aktual rilis + link live (US-033). */
  releaseDate?: string;
  liveLink?: string;
  createdAt: string;
}

export function isDistributionPattern(value: string): value is DistributionPattern {
  return (DISTRIBUTION_PATTERNS as readonly string[]).includes(value);
}
