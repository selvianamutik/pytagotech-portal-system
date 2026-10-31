import { createClient } from "@/lib/supabase/client";
import {
  listActiveTeamMembers,
  listMasterOptions,
  listTeamMembers,
} from "@/services/master-data";
import type { TeamMember } from "@/types/master-data";
import type {
  CreateLeadInput,
  Lead,
  UpdateLeadInput,
} from "@/types/lead";
import {
  INDUSTRY_CATEGORIES,
  LEAD_STATUSES,
  isIndustryCategory,
  isLeadStatus,
} from "@/types/lead";
import {
  isValidEmail,
  isValidWhatsapp,
  normalizeWhatsapp,
} from "@/lib/validators";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan akses data Lead CRM (US-007..013, FR-6..10).
 *
 * Tabel `leads` memakai UUID sebagai primary key dan `display_id` ramah-user
 * (`LEAD-xxx`, DEC-006/DEC-010). Kontrak UI tetap memakai display ID agar
 * route/komponen tidak berubah; service ini yang memetakan display ID ke UUID
 * saat menulis ke database.
 *
 * Nama PIC diambil dari `team_members` (termasuk anggota nonaktif) supaya
 * histori lead tetap terbaca. Validasi form memakai `master_options` aktif
 * sebagai sumber kebenaran (FR-3).
 *
 * Komponen HANYA boleh memanggil fungsi dari file ini.
 */

interface DbError {
  message: string;
  code?: string;
}

interface LeadRow {
  id: string;
  display_id: string;
  contact_date: string;
  company_name: string;
  industry: string;
  whatsapp: string;
  instagram: string | null;
  email: string;
  pic_id: string | null;
  status: string;
  next_follow_up: string | null;
  source: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

const LEAD_COLUMNS =
  "id, display_id, contact_date, company_name, industry, whatsapp, instagram, email, pic_id, status, next_follow_up, source, archived_at, created_at, updated_at";

function errorMessage(error: DbError | null, fallback: string): string {
  if (!error) {
    return fallback;
  }
  if (error.code === "23503") {
    return "Kategori industri, status, atau PIC tidak dikenal.";
  }
  if (error.code === "42501") {
    return "Anda tidak memiliki akses untuk mengubah lead.";
  }
  return error.message || fallback;
}

function teamNameMap(members: TeamMember[]): Map<string, string> {
  return new Map(members.map((member) => [member.id, member.name]));
}

function toLead(row: LeadRow, names: Map<string, string>): Lead {
  return {
    id: row.display_id,
    contactDate: row.contact_date,
    companyName: row.company_name,
    industry: row.industry,
    whatsapp: row.whatsapp,
    instagram: row.instagram ?? "",
    email: row.email,
    picName: row.pic_id ? names.get(row.pic_id) ?? "" : "",
    status: row.status as Lead["status"],
    nextFollowUp: row.next_follow_up ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Baca seluruh lead aktif beserta nama PIC (termasuk PIC nonaktif). */
async function fetchLeads(): Promise<ServiceResult<Lead[]>> {
  const supabase = createClient();
  const [leadsResult, membersResult] = await Promise.all([
    supabase.from("leads").select(LEAD_COLUMNS),
    listTeamMembers(),
  ]);

  if (leadsResult.error) {
    return {
      data: null,
      error: errorMessage(leadsResult.error, "Gagal memuat lead."),
    };
  }
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }

  const names = teamNameMap(membersResult.data);
  const leads = ((leadsResult.data ?? []) as LeadRow[])
    .filter((row) => row.archived_at === null)
    .map((row) => toLead(row, names))
    .sort(
      (a, b) =>
        b.contactDate.localeCompare(a.contactDate) || b.id.localeCompare(a.id)
    );

  return { data: leads, error: null };
}

export async function listLeads(): Promise<ServiceResult<Lead[]>> {
  return fetchLeads();
}

export async function getLead(leadId: string): Promise<ServiceResult<Lead>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("display_id", leadId)
    .limit(1);
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat lead.") };
  }
  const row = ((data ?? []) as LeadRow[])[0];
  if (!row) {
    return { data: null, error: "Lead tidak ditemukan." };
  }

  const membersResult = await listTeamMembers();
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }
  return {
    data: toLead(row, teamNameMap(membersResult.data)),
    error: null,
  };
}

/**
 * Daftar PIC aktif untuk dropdown penugasan (US-005, AC2; US-009).
 * Sumber tunggal `team_members` aktif — tidak ada fallback mock.
 */
export async function listLeadPICs(): Promise<
  ServiceResult<{ id: string; name: string }[]>
> {
  const team = await listActiveTeamMembers();
  if (team.error || !team.data) {
    return {
      data: null,
      error: team.error ?? "Gagal memuat daftar tim/PIC.",
    };
  }
  return {
    data: team.data.map((member) => ({ id: member.id, name: member.name })),
    error: null,
  };
}

interface LeadReferenceData {
  members: TeamMember[];
  activeMembers: TeamMember[];
  industries: string[];
  statuses: string[];
}

/**
 * Opsi validasi dari database: tim/PIC + `master_options`.
 * Bila tabel master masih kosong, pakai konstanta bawaan agar pesan validasi
 * tetap jelas (insert tetap akan ditolak FK bila database benar-benar kosong).
 */
async function loadReferenceData(): Promise<ServiceResult<LeadReferenceData>> {
  const [membersResult, mastersResult] = await Promise.all([
    listTeamMembers(),
    listMasterOptions(),
  ]);
  if (membersResult.error || !membersResult.data) {
    return {
      data: null,
      error: membersResult.error ?? "Gagal memuat data tim/PIC.",
    };
  }
  if (mastersResult.error || !mastersResult.data) {
    return {
      data: null,
      error: mastersResult.error ?? "Gagal memuat master data.",
    };
  }

  const industries = mastersResult.data
    .filter((option) => option.category === "industry")
    .map((option) => option.value);
  const statuses = mastersResult.data
    .filter((option) => option.category === "lead_status")
    .map((option) => option.value);

  return {
    data: {
      members: membersResult.data,
      activeMembers: membersResult.data.filter((member) => member.isActive),
      industries: industries.length > 0 ? industries : [...INDUSTRY_CATEGORIES],
      statuses: statuses.length > 0 ? statuses : [...LEAD_STATUSES],
    },
    error: null,
  };
}

export interface LeadValidationOptions {
  picNames: string[];
  industries: string[];
  statuses: string[];
}

/** Opsi validasi untuk pemakai luar (mis. preview impor CSV). */
export async function getLeadValidationOptions(): Promise<
  ServiceResult<LeadValidationOptions>
> {
  const reference = await loadReferenceData();
  if (reference.error || !reference.data) {
    return {
      data: null,
      error: reference.error ?? "Gagal memuat opsi validasi lead.",
    };
  }
  return {
    data: {
      picNames: reference.data.activeMembers.map((member) => member.name),
      industries: reference.data.industries,
      statuses: reference.data.statuses,
    },
    error: null,
  };
}

/**
 * Validasi satu baris input lead (dipakai form, update, dan impor CSV).
 * `options` diisi dari `master_options` aktif; tanpa opsi, konstanta bawaan
 * dipakai agar pemanggil lama tetap bekerja.
 */
export function validateLeadInput(
  input: CreateLeadInput,
  picNames: string[],
  options?: { industries?: string[]; statuses?: string[] }
): string | null {
  if (input.companyName.trim().length === 0) {
    return "Nama perusahaan/brand wajib diisi.";
  }
  if (
    options?.industries
      ? !options.industries.includes(input.industry)
      : !isIndustryCategory(input.industry)
  ) {
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
  if (
    options?.statuses
      ? !options.statuses.includes(input.status)
      : !isLeadStatus(input.status)
  ) {
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
 * Cari lead duplikat di dalam daftar yang sudah dimuat. Dipakai impor CSV
 * agar satu query cukup untuk semua baris.
 */
export function findDuplicatesIn(
  leads: Lead[],
  whatsapp: string,
  companyName: string,
  excludeId?: string
): Lead[] {
  const normalized = normalizeWhatsapp(whatsapp);
  const normalizedName = companyName.trim().toLowerCase();
  return leads.filter(
    (lead) =>
      lead.id !== excludeId &&
      (lead.whatsapp === normalized ||
        lead.companyName.trim().toLowerCase() === normalizedName)
  );
}

/**
 * Cari lead yang kemungkinan duplikat: WhatsApp sama (setelah normalisasi)
 * atau nama perusahaan sama (case-insensitive). `excludeId` dipakai saat update.
 */
export async function findDuplicates(
  whatsapp: string,
  companyName: string,
  excludeId?: string
): Promise<Lead[]> {
  const { data } = await listLeads();
  return findDuplicatesIn(data ?? [], whatsapp, companyName, excludeId);
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
  const reference = await loadReferenceData();
  if (reference.error || !reference.data) {
    return {
      data: null,
      error: reference.error ?? "Gagal memuat opsi lead.",
      warning: null,
    };
  }

  const { activeMembers, industries, statuses } = reference.data;
  const validationError = validateLeadInput(
    input,
    activeMembers.map((member) => member.name),
    { industries, statuses }
  );
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  const pic = activeMembers.find((member) => member.name === input.picName);
  if (!pic) {
    return { data: null, error: "PIC tidak dikenal.", warning: null };
  }

  const duplicates = await findDuplicates(input.whatsapp, input.companyName);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      contact_date: input.contactDate,
      company_name: input.companyName.trim(),
      industry: input.industry,
      whatsapp: normalizeWhatsapp(input.whatsapp),
      instagram: input.instagram.trim() || null,
      email: input.email.trim().toLowerCase(),
      pic_id: pic.id,
      status: input.status,
      next_follow_up: input.nextFollowUp || null,
      source: input.source?.trim() || null,
    })
    .select(LEAD_COLUMNS);

  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menyimpan lead."),
      warning: null,
    };
  }
  const row = ((data ?? []) as LeadRow[])[0];
  if (!row) {
    return { data: null, error: "Lead gagal disimpan.", warning: null };
  }

  return {
    data: toLead(row, new Map([[pic.id, pic.name]])),
    error: null,
    warning: duplicates.length > 0 ? duplicateWarning(duplicates) : null,
  };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput
): Promise<SaveLeadResult<Lead>> {
  const supabase = createClient();
  const { data: rowData, error: rowError } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("display_id", leadId)
    .limit(1);
  if (rowError) {
    return {
      data: null,
      error: errorMessage(rowError, "Gagal memuat lead."),
      warning: null,
    };
  }
  const row = ((rowData ?? []) as LeadRow[])[0];
  if (!row) {
    return { data: null, error: "Lead tidak ditemukan.", warning: null };
  }

  const reference = await loadReferenceData();
  if (reference.error || !reference.data) {
    return {
      data: null,
      error: reference.error ?? "Gagal memuat opsi lead.",
      warning: null,
    };
  }

  const { members, activeMembers, industries, statuses } = reference.data;
  const current = toLead(row, teamNameMap(members));
  const merged: CreateLeadInput = {
    contactDate: input.contactDate ?? current.contactDate,
    companyName: input.companyName ?? current.companyName,
    industry: input.industry ?? current.industry,
    whatsapp: input.whatsapp ?? current.whatsapp,
    instagram: input.instagram ?? current.instagram,
    email: input.email ?? current.email,
    picName: input.picName ?? current.picName,
    status: input.status ?? current.status,
    nextFollowUp: input.nextFollowUp ?? current.nextFollowUp,
    source: input.source ?? current.source,
  };

  // Nilai lama yang sudah nonaktif tetap boleh dipertahankan saat mengubah
  // field lain; opsi baru tetap dibatasi ke master data aktif.
  const allowedPicNames = activeMembers.map((member) => member.name);
  if (current.picName && !allowedPicNames.includes(current.picName)) {
    allowedPicNames.push(current.picName);
  }
  const allowedIndustries = [...industries];
  if (!allowedIndustries.includes(current.industry)) {
    allowedIndustries.push(current.industry);
  }
  const allowedStatuses = [...statuses];
  if (!allowedStatuses.includes(current.status)) {
    allowedStatuses.push(current.status);
  }

  const validationError = validateLeadInput(merged, allowedPicNames, {
    industries: allowedIndustries,
    statuses: allowedStatuses,
  });
  if (validationError) {
    return { data: null, error: validationError, warning: null };
  }

  const pic = members.find((member) => member.name === merged.picName);
  if (!pic) {
    return { data: null, error: "PIC tidak dikenal.", warning: null };
  }

  const now = new Date().toISOString();
  const { data: updatedData, error: updateError } = await supabase
    .from("leads")
    .update({
      contact_date: merged.contactDate,
      company_name: merged.companyName.trim(),
      industry: merged.industry,
      whatsapp: normalizeWhatsapp(merged.whatsapp),
      instagram: merged.instagram.trim() || null,
      email: merged.email.trim().toLowerCase(),
      pic_id: pic.id,
      status: merged.status,
      next_follow_up: merged.nextFollowUp || null,
      source: merged.source?.trim() || null,
      updated_at: now,
    })
    .eq("display_id", leadId)
    .select(LEAD_COLUMNS);
  if (updateError) {
    return {
      data: null,
      error: errorMessage(updateError, "Gagal mengubah lead."),
      warning: null,
    };
  }
  const updatedRow = ((updatedData ?? []) as LeadRow[])[0];
  if (!updatedRow) {
    return {
      data: null,
      error: "Lead tidak ditemukan atau tidak dapat diubah.",
      warning: null,
    };
  }

  const updated = toLead(updatedRow, teamNameMap(members));

  const duplicates = await findDuplicates(
    merged.whatsapp,
    merged.companyName,
    leadId
  );
  return {
    data: updated,
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
 * Sumber data Supabase; filter/paginasi dijalankan di service agar kontrak
 * hasil sama dengan Fase 1. Volume lead portal internal masih kecil.
 */
export async function queryLeads(
  query: LeadQuery
): Promise<ServiceResult<LeadQueryResult>> {
  const { data: stored, error } = await listLeads();
  if (error || !stored) {
    return { data: null, error: error ?? "Gagal memuat lead." };
  }

  const search = (query.search ?? "").trim().toLowerCase();
  const sortBy: LeadSortKey = query.sortBy ?? "contactDate";
  const sortDir: SortDirection = query.sortDir ?? "desc";
  const limit = query.limit && query.limit > 0 ? query.limit : DEFAULT_QUERY_LIMIT;
  const page = query.page && query.page > 0 ? query.page : 1;

  let filtered = stored.filter((lead) => {
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
    .map((lead) => ({ ...lead }));

  return { data: { items, total, page: safePage, limit, pageCount }, error: null };
}

/**
 * Tetapkan/ubah PIC untuk satu atau banyak lead sekaligus (US-009).
 * Perubahan PIC dicatat otomatis oleh trigger audit database.
 */
export async function assignLeadPIC(
  leadIds: string[],
  picName: string
): Promise<ServiceResult<Lead[]>> {
  if (leadIds.length === 0) {
    return { data: null, error: "Pilih minimal satu lead." };
  }

  const pics = await listLeadPICs();
  if (pics.error || !pics.data) {
    return { data: null, error: pics.error ?? "Gagal memuat daftar PIC." };
  }
  const target = pics.data.find((pic) => pic.name === picName);
  if (!target) {
    return { data: null, error: "PIC tidak dikenal." };
  }

  const { data: currentLeads, error: listError } = await listLeads();
  if (listError || !currentLeads) {
    return { data: null, error: listError ?? "Gagal memuat lead." };
  }
  const byId = new Map(currentLeads.map((lead) => [lead.id, lead]));
  const unknown = leadIds.filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    return { data: null, error: `Lead tidak ditemukan: ${unknown.join(", ")}.` };
  }

  const changed = leadIds.filter((id) => byId.get(id)?.picName !== picName);
  const now = new Date().toISOString();
  if (changed.length > 0) {
    const supabase = createClient();
    const { data: updatedRows, error: updateError } = await supabase
      .from("leads")
      .update({ pic_id: target.id, updated_at: now })
      .in("display_id", changed)
      .select("display_id");
    if (updateError) {
      return {
        data: null,
        error: errorMessage(updateError, "Gagal menetapkan PIC."),
      };
    }
    if ((updatedRows ?? []).length !== changed.length) {
      return {
        data: null,
        error:
          "PIC tidak tersimpan untuk sebagian lead (0 baris). Muat ulang halaman.",
      };
    }
  }

  return {
    data: leadIds.map((id) => {
      const lead = byId.get(id)!;
      return lead.picName === picName
        ? lead
        : { ...lead, picName, updatedAt: now };
    }),
    error: null,
  };
}

/**
 * Atur tanggal follow-up berikutnya (US-012). Perubahan dicatat otomatis
 * oleh trigger audit database.
 */
export async function setNextFollowUp(
  leadId: string,
  nextFollowUp: string
): Promise<ServiceResult<Lead>> {
  if (!nextFollowUp || Number.isNaN(Date.parse(nextFollowUp))) {
    return { data: null, error: "Tanggal follow-up tidak valid." };
  }

  const current = await getLead(leadId);
  if (current.error || !current.data) {
    return {
      data: null,
      error: current.error ?? "Lead tidak ditemukan.",
    };
  }

  const supabase = createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads")
    .update({ next_follow_up: nextFollowUp, updated_at: now })
    .eq("display_id", leadId)
    .select("display_id");
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menyimpan follow-up."),
    };
  }
  if ((data ?? []).length === 0) {
    return { data: null, error: "Lead tidak ditemukan." };
  }

  return {
    data: { ...current.data, nextFollowUp, updatedAt: now },
    error: null,
  };
}
