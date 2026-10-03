/**
 * Kontrak Deal Handover (US-015 s.d. US-018, FR-11, FR-12, FR-13, FR-14).
 * Fase 1: mock; Fase 2: tabel `deals` (+ `deal_payment_terms`,
 * `change_requests`) dengan trigger nama & kode.
 */

/** Alur status handover (FR-13). */
export const HANDOVER_STATUSES = [
  "Draft",
  "Menunggu Konfirmasi Produksi",
  "Dikonfirmasi",
  "Perlu Revisi",
] as const;

export type HandoverStatus = (typeof HANDOVER_STATUSES)[number];

export interface DealFeature {
  name: string;
  description: string;
}

/** Satu versi nilai/deadline (diisi change request yang Disetujui, US-018). */
export interface DealVersion {
  version: number;
  value: number;
  deadline: string;
  note: string;
  createdAt: string;
}

export interface DealHandover {
  /** Display ID (HDV-xxx) sesuai pola DEC-006. */
  id: string;
  title: string;
  /** Kode proyek unik (contoh: PYT-2026-001). */
  code: string;
  clientId: string;
  scope: string;
  features: DealFeature[];
  objective: string;
  /** Nilai deal dalam IDR. */
  value: number;
  /** Ringkasan skema termin (detail di US-016). */
  termScheme: string;
  /** Target deadline (YYYY-MM-DD). */
  deadline: string;
  notes: string;
  status: HandoverStatus;
  versions: DealVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealInput {
  title: string;
  code: string;
  clientId: string;
  scope: string;
  features: DealFeature[];
  objective: string;
  value: number;
  termScheme: string;
  deadline: string;
  notes: string;
}

export type UpdateDealInput = Partial<CreateDealInput>;

/**
 * Format nama proyek otomatis (FR-11):
 * `[Judul Project] - [Nama Klien] ([Kode Proyek])`.
 */
export function formatDealName(title: string, clientName: string, code: string): string {
  return `${title.trim()} - ${clientName.trim()} (${code.trim()})`;
}

export function isHandoverStatus(value: string): value is HandoverStatus {
  return (HANDOVER_STATUSES as readonly string[]).includes(value);
}
