/**
 * Kontrak inquiry sosmed (US-038, FR-28).
 * Routing SLA ≤ 15 menit (masuk → dialihkan WA resmi).
 * Konversi ke lead CRM mencatat sumber (`Lead.source`).
 * Fase 1: mock; Fase 2: tabel `inquiries`.
 */
export const INQUIRY_STATUSES = ["Diproses", "Handover Selesai", "Dialihkan"] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export interface Inquiry {
  id: string;
  platform: string;
  brand: string;
  /** ISO datetime waktu masuk. */
  receivedAt: string;
  /** ISO datetime dialihkan ke WhatsApp resmi (null = belum). */
  routedAt: string | null;
  status: InquiryStatus;
  /** Lead hasil konversi (FR-28). */
  leadId?: string;
  handler: string;
}

export interface InquiryInput {
  platform: string;
  brand: string;
  receivedAt: string;
  handler: string;
}

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(value);
}
