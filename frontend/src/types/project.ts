/**
 * Kontrak Proyek (US-019 s.d. US-026, FR-11, FR-15).
 * Satu proyek = satu PM (jawaban Q-001 opsi A) dan lahir dari satu
 * handover Dikonfirmasi tanpa input ulang (FR-15).
 * Fase 1: mock; Fase 2: tabel `projects` + relasi ke `deals`.
 */

/** Status proyek sesuai PRD US-019. */
export const PROJECT_STATUSES = [
  "Planning",
  "Active",
  "On Hold",
  "Completed",
  "Cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  /** Display ID (PRJ-xxx) sesuai pola DEC-006. */
  id: string;
  /** Nama terformat dari handover: [Judul] - [Klien] ([Kode]). */
  name: string;
  /** Kode proyek (disalin dari handover, unik). */
  code: string;
  clientId: string;
  /** Satu PM per proyek (Q-001 A). */
  pmName: string;
  /** Tanggal mulai (YYYY-MM-DD). */
  startDate: string;
  /** Target selesai (disalin dari deadline handover). */
  targetDate: string;
  /** Nilai proyek = nilai deal (IDR). */
  value: number;
  status: ProjectStatus;
  /** Handover asal (relasi dua arah dengan deals). */
  handoverId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  pmName: string;
  startDate: string;
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}
