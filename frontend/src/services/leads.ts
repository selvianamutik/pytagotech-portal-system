import { mockUsers } from "@/mocks/auth";
import { mockLeads } from "@/mocks/leads";
import type {
  CreateLeadInput,
  Lead,
  UpdateLeadInput,
} from "@/types/lead";
import { isIndustryCategory, isLeadStatus } from "@/types/lead";
import {
  isValidEmail,
  isValidWhatsapp,
  normalizeWhatsapp,
} from "@/lib/validators";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan akses data Lead CRM (US-007, FR-6, FR-7).
 * Fase 1: mock in-memory. Fase 2: tabel `leads` + trigger display ID.
 * Komponen HANYA boleh memanggil fungsi dari file ini.
 */

let leadStore: Lead[] = structuredClone(mockLeads);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockLeads(): void {
  leadStore = structuredClone(mockLeads);
}

function cloneLead(lead: Lead): Lead {
  return { ...lead };
}

export async function listLeads(): Promise<ServiceResult<Lead[]>> {
  return {
    data: [...leadStore]
      .sort((a, b) => b.contactDate.localeCompare(a.contactDate))
      .map(cloneLead),
    error: null,
  };
}

export async function getLead(leadId: string): Promise<ServiceResult<Lead>> {
  const lead = leadStore.find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  return { data: cloneLead(lead), error: null };
}

/** Daftar PIC (user aktif) untuk dropdown penugasan. */
export async function listLeadPICs(): Promise<
  ServiceResult<{ id: string; name: string }[]>
> {
  return {
    data: mockUsers
      .filter((user) => user.isActive)
      .map((user) => ({ id: user.id, name: user.name.split(" (")[0] })),
    error: null,
  };
}

function validateLeadInput(
  input: CreateLeadInput,
  picNames: string[]
): string | null {
  if (input.companyName.trim().length === 0) {
    return "Nama perusahaan/brand wajib diisi.";
  }
  if (!isIndustryCategory(input.industry)) {
    return "Kategori industri tidak dikenal.";
  }
  if (!isValidWhatsapp(input.whatsapp)) {
    return "Format nomor WhatsApp tidak valid (contoh: 0812-3456-7890).";
  }
  if (!isValidEmail(input.email)) {
    return "Format email tidak valid.";
  }
  if (input.instagram.trim().length > 0 && !/^@[\w.]{1,30}$/.test(input.instagram.trim())) {
    return "Format Instagram tidak valid (contoh: @namabrand).";
  }
  if (!picNames.includes(input.picName)) {
    return "PIC tidak dikenal.";
  }
  if (!isLeadStatus(input.status)) {
    return "Status lead tidak dikenal.";
  }
  if (Number.isNaN(Date.parse(input.contactDate))) {
    return "Tanggal hubungi tidak valid.";
  }
  return null;
}

/**
 * Cari lead yang kemungkinan duplikat: WhatsApp sama (setelah normalisasi)
 * atau nama perusahaan sama (case-insensitive). `excludeId` dipakai saat update.
 */
export function findDuplicates(
  whatsapp: string,
  companyName: string,
  excludeId?: string
): Lead[] {
  const normalized = normalizeWhatsapp(whatsapp);
  const normalizedName = companyName.trim().toLowerCase();
  return leadStore.filter(
    (lead) =>
      lead.id !== excludeId &&
      (lead.whatsapp === normalized ||
        lead.companyName.trim().toLowerCase() === normalizedName)
  );
}

function duplicateWarning(duplicates: Lead[]): string {
  const ids = duplicates.map((lead) => lead.id).join(", ");
  return `Kemungkinan duplikat dengan ${ids}. Periksa sebelum melanjutkan.`;
}

export interface SaveLeadResult<T> extends ServiceResult<T> {
  /** Peringatan non-blokir (duplikat); data tetap tersimpan. */
  warning: string | null;
}

export async function createLead(
  input: CreateLeadInput
): Promise<SaveLeadResult<Lead>> {
  const pics = await listLeadPICs();
  const picNames = (pics.data ?? []).map((pic) => pic.name);
  const validationError = validateLeadInput(input, picNames);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  const duplicates = findDuplicates(input.whatsapp, input.companyName);
  const nextNumber = leadStore.length + 1;
  const now = new Date().toISOString();
  const lead: Lead = {
    id: `LEAD-${String(nextNumber).padStart(3, "0")}`,
    contactDate: input.contactDate,
    companyName: input.companyName.trim(),
    industry: input.industry as Lead["industry"],
    whatsapp: normalizeWhatsapp(input.whatsapp),
    instagram: input.instagram.trim(),
    email: input.email.trim().toLowerCase(),
    picName: input.picName,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
  leadStore.push(lead);
  return {
    data: cloneLead(lead),
    error: null,
    warning: duplicates.length > 0 ? duplicateWarning(duplicates) : null,
  };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput
): Promise<SaveLeadResult<Lead>> {
  const lead = leadStore.find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan.", warning: null };
  }
  const merged: CreateLeadInput = {
    contactDate: input.contactDate ?? lead.contactDate,
    companyName: input.companyName ?? lead.companyName,
    industry: input.industry ?? lead.industry,
    whatsapp: input.whatsapp ?? lead.whatsapp,
    instagram: input.instagram ?? lead.instagram,
    email: input.email ?? lead.email,
    picName: input.picName ?? lead.picName,
    status: input.status ?? lead.status,
  };
  const pics = await listLeadPICs();
  const picNames = (pics.data ?? []).map((pic) => pic.name);
  const validationError = validateLeadInput(merged, picNames);
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  lead.contactDate = merged.contactDate;
  lead.companyName = merged.companyName.trim();
  lead.industry = merged.industry as Lead["industry"];
  lead.whatsapp = normalizeWhatsapp(merged.whatsapp);
  lead.instagram = merged.instagram.trim();
  lead.email = merged.email.trim().toLowerCase();
  lead.picName = merged.picName;
  lead.status = merged.status;
  lead.updatedAt = new Date().toISOString();

  const duplicates = findDuplicates(merged.whatsapp, merged.companyName, leadId);
  return {
    data: cloneLead(lead),
    error: null,
    warning: duplicates.length > 0 ? duplicateWarning(duplicates) : null,
  };
}
