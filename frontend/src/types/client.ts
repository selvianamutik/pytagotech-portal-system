/**
 * Kontrak Master Klien (US-014, FR-9).
 * Satu klien dapat memiliki banyak deal/proyek (relasi 1-N, dibuktikan
 * penghitung deal per klien di halaman). Klien lahir otomatis dari
 * lead Closing tanpa input ulang.
 * Fase 1: mock; Fase 2: tabel `clients` + relasi ke `deals`/`projects`.
 */
export interface Client {
  /** Display ID (KLI-xxx) sesuai pola DEC-006. */
  id: string;
  companyName: string;
  /** Nama PIC / Direktur klien. */
  picName: string;
  /** Telepon/WhatsApp ternormalisasi (diawali 62). */
  phone: string;
  email: string;
  /** Sumber lead (referrer), teks bebas — kandidat master data US-005. */
  referrer: string;
  /** Lead asal bila dibuat otomatis dari Closing (FR-9). */
  sourceLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  referrer: string;
  sourceLeadId?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;
