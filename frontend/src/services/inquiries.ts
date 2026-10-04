import { createLead } from "@/services/leads";
import type { CreateLeadInput } from "@/types/lead";
import type { Inquiry, InquiryInput } from "@/types/inquiry";
import { isInquiryStatus } from "@/types/inquiry";
import { isSosmedBrand, isSosmedPlatform } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan inquiry sosmed (US-038, FR-28).
 * Ambang routing interim 15 menit (resmi dari Pengaturan US-041).
 */

/** Ambang SLA routing WhatsApp — menit (interim; US-041 menjadi acuan). */
export const ROUTING_SLA_MINUTES = 15;

let inquiryStore: Inquiry[] = [
  {
    id: "INQ-001",
    platform: "TikTok",
    brand: "Pytabelajar",
    receivedAt: "2026-10-04T01:00:00Z",
    routedAt: "2026-10-04T01:10:00Z",
    status: "Handover Selesai",
    handler: "Alya",
  },
];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockInquiries(): void {
  inquiryStore = [
    {
      id: "INQ-001",
      platform: "TikTok",
      brand: "Pytabelajar",
      receivedAt: "2026-10-04T01:00:00Z",
      routedAt: "2026-10-04T01:10:00Z",
      status: "Handover Selesai",
      handler: "Alya",
    },
  ];
}

/** Menit masuk → dialihkan WA (null bila belum). */
export function routingMinutes(inquiry: {
  receivedAt: string;
  routedAt: string | null;
}): number | null {
  if (!inquiry.routedAt) {
    return null;
  }
  return Math.round(
    (new Date(inquiry.routedAt).getTime() - new Date(inquiry.receivedAt).getTime()) / 60000
  );
}

export function isRoutingSlaMet(
  inquiry: { receivedAt: string; routedAt: string | null },
  slaMinutes: number = ROUTING_SLA_MINUTES
): boolean {
  const minutes = routingMinutes(inquiry);
  return minutes !== null && minutes <= slaMinutes;
}

function validateInquiryInput(input: InquiryInput): string | null {
  if (!isSosmedPlatform(input.platform)) {
    return "Platform tidak dikenal.";
  }
  if (!isSosmedBrand(input.brand)) {
    return "Lini bisnis tidak dikenal.";
  }
  if (Number.isNaN(Date.parse(input.receivedAt))) {
    return "Waktu masuk tidak valid.";
  }
  return null;
}

export async function listInquiries(): Promise<ServiceResult<Inquiry[]>> {
  return {
    data: [...inquiryStore]
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .map((inquiry) => ({ ...inquiry })),
    error: null,
  };
}

export async function recordInquiry(
  input: InquiryInput
): Promise<ServiceResult<Inquiry>> {
  const validationError = validateInquiryInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const inquiry: Inquiry = {
    id: `INQ-${String(inquiryStore.length + 1).padStart(3, "0")}`,
    platform: input.platform,
    brand: input.brand,
    receivedAt: new Date(input.receivedAt).toISOString(),
    routedAt: null,
    status: "Diproses",
    handler: input.handler.trim(),
  };
  inquiryStore.push(inquiry);
  return { data: { ...inquiry }, error: null };
}

export async function markInquiryRouted(
  inquiryId: string,
  routedAt: string
): Promise<ServiceResult<Inquiry>> {
  const inquiry = inquiryStore.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return { data: null, error: "Inquiry tidak ditemukan." };
  }
  if (!routedAt || Number.isNaN(Date.parse(routedAt))) {
    return { data: null, error: "Waktu pengalihan tidak valid." };
  }
  if (Date.parse(routedAt) < Date.parse(inquiry.receivedAt)) {
    return { data: null, error: "Waktu pengalihan tidak boleh sebelum waktu masuk." };
  }
  inquiry.routedAt = new Date(routedAt).toISOString();
  if (inquiry.status === "Diproses") {
    inquiry.status = "Dialihkan";
  }
  return { data: { ...inquiry }, error: null };
}

export async function setInquiryStatus(
  inquiryId: string,
  status: string
): Promise<ServiceResult<Inquiry>> {
  const inquiry = inquiryStore.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return { data: null, error: "Inquiry tidak ditemukan." };
  }
  if (!isInquiryStatus(status)) {
    return { data: null, error: "Status inquiry tidak dikenal." };
  }
  inquiry.status = status;
  return { data: { ...inquiry }, error: null };
}

export interface ConvertInquiryInput {
  companyName: string;
  whatsapp: string;
  email: string;
  instagram?: string;
  picName: string;
}

/**
 * Jadikan lead CRM dari inquiry (FR-28): sumber `Sosmed/<platform>`
 * tercatat di lead; inquiry menjadi Handover Selesai + tertaut.
 */
export async function convertInquiryToLead(
  inquiryId: string,
  input: ConvertInquiryInput
): Promise<ServiceResult<{ leadId: string }>> {
  const inquiry = inquiryStore.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return { data: null, error: "Inquiry tidak ditemukan." };
  }
  if (inquiry.leadId) {
    return { data: null, error: "Inquiry ini sudah dijadikan lead." };
  }
  const leadInput: CreateLeadInput = {
    contactDate: inquiry.receivedAt.slice(0, 10),
    companyName: input.companyName,
    industry: "Lainnya",
    whatsapp: input.whatsapp,
    instagram: input.instagram ?? "",
    email: input.email,
    picName: input.picName,
    status: "New",
    source: `Sosmed/${inquiry.platform}`,
  };
  const { data: lead, error } = await createLead(leadInput);
  if (error || !lead) {
    return { data: null, error: error ?? "Gagal membuat lead." };
  }
  inquiry.leadId = lead.id;
  inquiry.status = "Handover Selesai";
  return { data: { leadId: lead.id }, error: null };
}
