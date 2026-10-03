/**
 * Kontrak data Lead CRM (US-007, FR-6, FR-7).
 * Fase 1: mock (`@/mocks/leads`) via `services/leads`.
 * Fase 2: tabel `leads` + trigger display ID + deteksi duplikat di DB.
 */

/** 7 tahap status lead sesuai PRD US-007. */
export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Follow Up",
  "Interest",
  "Not Interested",
  "Lost",
  "Closing",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * Opsi kategori industri (Fase 1, lokal modul).
 * US-005 (master data terpusat) akan menggantikan daftar ini dari database.
 */
export const INDUSTRY_CATEGORIES = [
  "Teknologi",
  "Retail & E-commerce",
  "F&B",
  "Pendidikan",
  "Kesehatan",
  "Properti",
  "Keuangan",
  "Manufaktur",
  "Jasa",
  "Lainnya",
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];

export interface Lead {
  /** Display ID (LEAD-xxx) sesuai DEC-006; UUID dipakai di DB Fase 2. */
  id: string;
  /** Tanggal pertama menghubungi (ISO date, WIB). */
  contactDate: string;
  companyName: string;
  industry: IndustryCategory;
  /** Nomor WhatsApp ternormalisasi (diawali 62). */
  whatsapp: string;
  instagram: string;
  email: string;
  /** Nama PIC sales. */
  picName: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  contactDate: string;
  companyName: string;
  industry: string;
  whatsapp: string;
  instagram: string;
  email: string;
  picName: string;
  status: LeadStatus;
}

export type UpdateLeadInput = Partial<CreateLeadInput>;

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isIndustryCategory(value: string): value is IndustryCategory {
  return (INDUSTRY_CATEGORIES as readonly string[]).includes(value);
}
