import { mockUsers } from "@/mocks/auth";
import { mockLeads } from "@/mocks/leads";
import { logAudit } from "@/services/audit";
import { listActiveTeamMembers } from "@/services/master-data";
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

/**
 * Daftar PIC untuk dropdown penugasan (US-005, AC2).
 * Sumber utama `team_members` aktif; bila database belum bisa dibaca
 * (mis. sesi/demo belum siap), pakai user aktif dari mock agar form tetap
 * berjalan. Tabel yang kosong tetap menghasilkan daftar kosong, bukan mock.
 */
export async function listLeadPICs(): Promise<
  ServiceResult<{ id: string; name: string }[]>
> {
  try {
    const team = await listActiveTeamMembers();
    if (!team.error) {
      return {
        data: (team.data ?? []).map((member) => ({
          id: member.id,
          name: member.name,
        })),
        error: null,
      };
    }
  } catch {
    // Jatuh ke mock di bawah; dropdown tidak boleh kosong karena database
    // belum siap.
  }
  return {
    data: mockUsers
      .filter((user) => user.isActive)
      .map((user) => ({ id: user.id, name: user.name.split(" (")[0] })),
    error: null,
  };
}

/**
 * Validasi satu baris input lead (dipakai form, update, dan impor CSV).
 * Diekspor agar impor CSV memakai aturan yang sama persis.
 */
export function validateLeadInput(
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
  if (input.nextFollowUp && Number.isNaN(Date.parse(input.nextFollowUp))) {
    return "Tanggal follow-up tidak valid.";
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
    nextFollowUp: input.nextFollowUp || undefined,
    source: input.source?.trim() || undefined,
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
  input: UpdateLeadInput,
  actor?: AssignPicActor
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
    nextFollowUp: input.nextFollowUp ?? lead.nextFollowUp,
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
  const oldStatus = lead.status;
  lead.status = merged.status;
  lead.nextFollowUp = merged.nextFollowUp || undefined;
  lead.updatedAt = new Date().toISOString();

  // Perubahan status tercatat untuk timeline US-012.
  if (oldStatus !== merged.status) {
    await logAudit({
      actorId: actor?.id ?? "system",
      actorName: actor?.name ?? "Sistem",
      action: "lead.update-status",
      entityType: "lead",
      entityId: lead.id,
      oldValue: oldStatus,
      newValue: merged.status,
    });
  }

  const duplicates = findDuplicates(merged.whatsapp, merged.companyName, leadId);
  return {
    data: cloneLead(lead),
    error: null,
    warning: duplicates.length > 0 ? duplicateWarning(duplicates) : null,
  };
}

export type LeadSortKey = "companyName" | "contactDate" | "status" | "picName";
export type SortDirection = "asc" | "desc";

export interface LeadQuery {
  /** Pencarian teks: perusahaan, email, WhatsApp, Instagram. */
  search?: string;
  statuses?: Lead["status"][];
  picNames?: string[];
  industries?: Lead["industry"][];
  /** Rentang tanggal hubungi (inklusif, format YYYY-MM-DD). */
  dateFrom?: string;
  dateTo?: string;
  sortBy?: LeadSortKey;
  sortDir?: SortDirection;
  page?: number;
  limit?: number;
}

export interface LeadQueryResult {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

const DEFAULT_QUERY_LIMIT = 5;

/**
 * Pencarian, filter multi-kriteria, sort, dan paginasi (US-008).
 * Fase 2: diganti query Supabase server-side dengan parameter sama.
 */
export async function queryLeads(
  query: LeadQuery
): Promise<ServiceResult<LeadQueryResult>> {
  const search = (query.search ?? "").trim().toLowerCase();
  const sortBy: LeadSortKey = query.sortBy ?? "contactDate";
  const sortDir: SortDirection = query.sortDir ?? "desc";
  const limit = query.limit && query.limit > 0 ? query.limit : DEFAULT_QUERY_LIMIT;
  const page = query.page && query.page > 0 ? query.page : 1;

  let filtered = leadStore.filter((lead) => {
    if (search) {
      const haystack =
        `${lead.companyName} ${lead.email} ${lead.whatsapp} ${lead.instagram}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    if (query.statuses && query.statuses.length > 0 && !query.statuses.includes(lead.status)) {
      return false;
    }
    if (query.picNames && query.picNames.length > 0 && !query.picNames.includes(lead.picName)) {
      return false;
    }
    if (query.industries && query.industries.length > 0 && !query.industries.includes(lead.industry)) {
      return false;
    }
    if (query.dateFrom && lead.contactDate < query.dateFrom) {
      return false;
    }
    if (query.dateTo && lead.contactDate > query.dateTo) {
      return false;
    }
    return true;
  });

  const direction = sortDir === "asc" ? 1 : -1;
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "status") {
      return a.status.localeCompare(b.status) * direction;
    }
    return String(a[sortBy]).localeCompare(String(b[sortBy])) * direction;
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pageCount);
  const items = filtered
    .slice((safePage - 1) * limit, safePage * limit)
    .map(cloneLead);

  return { data: { items, total, page: safePage, limit, pageCount }, error: null };
}

export interface AssignPicActor {
  id: string;
  name: string;
}

/**
 * Tetapkan/ubah PIC untuk satu atau banyak lead sekaligus (US-009).
 * Setiap perubahan PIC dicatat di audit trail (pratinjau US-004).
 */
export async function assignLeadPIC(
  leadIds: string[],
  picName: string,
  actor: AssignPicActor
): Promise<ServiceResult<Lead[]>> {
  if (leadIds.length === 0) {
    return { data: null, error: "Pilih minimal satu lead." };
  }
  const pics = await listLeadPICs();
  const picNames = (pics.data ?? []).map((pic) => pic.name);
  if (!picNames.includes(picName)) {
    return { data: null, error: "PIC tidak dikenal." };
  }
  const unknown = leadIds.filter(
    (id) => !leadStore.some((lead) => lead.id === id)
  );
  if (unknown.length > 0) {
    return { data: null, error: `Lead tidak ditemukan: ${unknown.join(", ")}.` };
  }

  const now = new Date().toISOString();
  const updated: Lead[] = [];
  for (const id of leadIds) {
    const lead = leadStore.find((item) => item.id === id);
    if (!lead) {
      continue;
    }
    const oldPic = lead.picName;
    lead.picName = picName;
    lead.updatedAt = now;
    updated.push(cloneLead(lead));
    if (oldPic !== picName) {
      await logAudit({
        actorId: actor.id,
        actorName: actor.name,
        action: "lead.assign-pic",
        entityType: "lead",
        entityId: lead.id,
        oldValue: oldPic,
        newValue: picName,
      });
    }
  }
  return { data: updated, error: null };
}

/**
 * Atur tanggal follow-up berikutnya (US-012). Dicatat audit `lead.followup`.
 */
export async function setNextFollowUp(
  leadId: string,
  nextFollowUp: string,
  actor: AssignPicActor
): Promise<ServiceResult<Lead>> {
  const lead = leadStore.find((item) => item.id === leadId);
  if (!lead) {
    return { data: null, error: "Lead tidak ditemukan." };
  }
  if (!nextFollowUp || Number.isNaN(Date.parse(nextFollowUp))) {
    return { data: null, error: "Tanggal follow-up tidak valid." };
  }
  const oldValue = lead.nextFollowUp ?? null;
  lead.nextFollowUp = nextFollowUp;
  lead.updatedAt = new Date().toISOString();
  await logAudit({
    actorId: actor.id,
    actorName: actor.name,
    action: "lead.followup",
    entityType: "lead",
    entityId: lead.id,
    oldValue,
    newValue: nextFollowUp,
  });
  return { data: cloneLead(lead), error: null };
}
