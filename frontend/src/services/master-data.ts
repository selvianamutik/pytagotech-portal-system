import { createClient } from "@/lib/supabase/client";
import type { ServiceResult } from "@/services/result";
import type {
  MasterOption,
  MasterOptionCategory,
  MasterOptionInput,
  MasterOptionsByCategory,
  TeamMember,
  TeamMemberInput,
} from "@/types/master-data";
import {
  fallbackMasterOptions,
  groupMasterOptions,
  isMasterOptionCategory,
  isTeamMemberStatus,
} from "@/types/master-data";

/**
 * Lapisan akses master data (US-005, FR-3).
 *
 * - `master_options`: delapan kelompok dropdown terpusat. RLS hanya
 *   menampilkan opsi aktif ke user biasa; Super Admin boleh melihat nonaktif.
 * - `team_members`: pool tim/PIC. Skema yang disetujui belum punya flag aktif,
 *   sehingga penghapusan dijaga dengan cek referensi (lihat Q-015).
 *
 * Komponen hanya boleh memanggil fungsi dari file ini.
 */

type BrowserSupabase = ReturnType<typeof createClient>;

interface MasterOptionRow {
  category: string;
  value: string;
  is_active: boolean;
}

interface TeamMemberRow {
  id: string;
  profile_id: string | null;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbError {
  message: string;
  code?: string;
}

const MAX_OPTION_LENGTH = 80;
const MAX_TEAM_NAME_LENGTH = 100;

const MASTER_OPTION_USAGE: Record<
  MasterOptionCategory,
  { table: string; column: string }[]
> = {
  lead_status: [
    { table: "leads", column: "status" },
    { table: "lead_status_history", column: "status" },
  ],
  industry: [{ table: "leads", column: "industry" }],
  interest_stage: [{ table: "lead_interests", column: "stage" }],
  brand: [
    { table: "content_ideas", column: "brand" },
    { table: "content_materials", column: "brand" },
    { table: "account_growth", column: "brand" },
    { table: "community_interactions", column: "brand" },
    { table: "inquiries", column: "brand" },
    { table: "strategy_evaluations", column: "brand" },
  ],
  platform: [
    { table: "idea_platforms", column: "platform" },
    { table: "material_platforms", column: "platform" },
    { table: "publications", column: "platform" },
    { table: "account_growth", column: "platform" },
    { table: "community_interactions", column: "platform" },
    { table: "inquiries", column: "platform" },
  ],
  pillar: [
    { table: "content_ideas", column: "pillar" },
    { table: "strategy_evaluations", column: "pillar" },
  ],
  feature_category: [{ table: "features", column: "category" }],
  priority: [{ table: "features", column: "priority" }],
};

/**
 * Semua kolom yang mengarah ke `team_members`. Sebagian besar FK memakai
 * ON DELETE SET NULL, jadi penghapusan harus dicegah di service agar
 * penugasan lama tidak hilang diam-diam.
 */
const TEAM_MEMBER_USAGE: { table: string; column: string }[] = [
  { table: "leads", column: "pic_id" },
  { table: "lead_status_history", column: "changed_by" },
  { table: "lead_activities", column: "author_id" },
  { table: "deals", column: "created_by" },
  { table: "deals", column: "confirmed_by" },
  { table: "change_requests", column: "created_by" },
  { table: "projects", column: "pm_id" },
  { table: "tasks", column: "assignee_id" },
  { table: "features", column: "developer_id" },
  { table: "developer_capacity", column: "developer_id" },
  { table: "content_materials", column: "copywriter_id" },
  { table: "content_materials", column: "designer_id" },
  { table: "content_materials", column: "video_editor_id" },
  { table: "content_materials", column: "gate_override_by" },
  { table: "post_metrics", column: "recorded_by" },
  { table: "community_interactions", column: "handler_id" },
  { table: "inquiries", column: "handler_id" },
  { table: "comments", column: "author_id" },
  { table: "attachments", column: "uploaded_by" },
];

function errorMessage(error: DbError | null, fallback: string): string {
  if (!error) {
    return fallback;
  }
  if (error.code === "23503") {
    return "Data ini sedang dipakai modul lain. Nonaktifkan atau hapus referensinya lebih dulu.";
  }
  if (error.code === "23505") {
    return "Nilai tersebut sudah ada.";
  }
  return error.message || fallback;
}

function toMasterOption(row: MasterOptionRow): MasterOption | null {
  if (!isMasterOptionCategory(row.category)) {
    return null;
  }
  return {
    category: row.category,
    value: row.value,
    isActive: row.is_active,
  };
}

function toTeamMember(row: TeamMemberRow): TeamMember | null {
  if (!isTeamMemberStatus(row.status)) {
    return null;
  }
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function hasReference(
  supabase: BrowserSupabase,
  table: string,
  column: string,
  value: string
): Promise<{ referenced: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq(column, value)
    .limit(1);
  if (error) {
    return { referenced: false, error: error.message };
  }
  return { referenced: (data ?? []).length > 0, error: null };
}

/**
 * Cek apakah nilai master masih dipakai tabel lain. Dipakai sebelum rename
 * dan delete agar service memberi pesan yang jelas, bukan error FK mentah.
 */
export async function isMasterOptionInUse(
  category: MasterOptionCategory,
  value: string
): Promise<{ inUse: boolean; error: string | null }> {
  const supabase = createClient();
  const references = MASTER_OPTION_USAGE[category];
  for (const reference of references) {
    const result = await hasReference(
      supabase,
      reference.table,
      reference.column,
      value
    );
    if (result.error) {
      return { inUse: false, error: result.error };
    }
    if (result.referenced) {
      return { inUse: true, error: null };
    }
  }
  return { inUse: false, error: null };
}

export async function isTeamMemberInUse(
  teamMemberId: string
): Promise<{ inUse: boolean; error: string | null }> {
  const supabase = createClient();
  for (const reference of TEAM_MEMBER_USAGE) {
    const result = await hasReference(
      supabase,
      reference.table,
      reference.column,
      teamMemberId
    );
    if (result.error) {
      return { inUse: false, error: result.error };
    }
    if (result.referenced) {
      return { inUse: true, error: null };
    }
  }
  return { inUse: false, error: null };
}

/** Baca opsi master. `includeInactive` hanya efektif untuk Super Admin (RLS). */
export async function listMasterOptions(options?: {
  includeInactive?: boolean;
}): Promise<ServiceResult<MasterOption[]>> {
  const supabase = createClient();
  let query = supabase
    .from("master_options")
    .select("category, value, is_active")
    .order("category", { ascending: true })
    .order("value", { ascending: true });
  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat master data.") };
  }
  return {
    data: ((data ?? []) as MasterOptionRow[])
      .map(toMasterOption)
      .filter((row): row is MasterOption => row !== null),
    error: null,
  };
}

/**
 * Baca opsi aktif dan kelompokkan per kategori untuk form.
 * Jika database sama sekali belum berisi opsi, pakai nilai cadangan agar
 * aplikasi demo tidak kehilangan seluruh dropdown.
 */
export async function getActiveMasterOptions(): Promise<
  ServiceResult<MasterOptionsByCategory>
> {
  const result = await listMasterOptions();
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "Gagal memuat master data." };
  }
  if (result.data.length === 0) {
    return { data: fallbackMasterOptions(), error: null };
  }
  return { data: groupMasterOptions(result.data), error: null };
}

async function findMasterOption(
  supabase: BrowserSupabase,
  category: MasterOptionCategory,
  value: string
): Promise<MasterOption | null> {
  const { data } = await supabase
    .from("master_options")
    .select("category, value, is_active")
    .eq("category", category)
    .eq("value", value)
    .limit(1);
  const row = ((data ?? []) as MasterOptionRow[])[0];
  return row ? toMasterOption(row) : null;
}

export async function createMasterOption(
  input: MasterOptionInput
): Promise<ServiceResult<MasterOption>> {
  if (!isMasterOptionCategory(input.category)) {
    return { data: null, error: "Kategori master data tidak dikenal." };
  }
  const value = input.value.trim();
  if (value.length === 0) {
    return { data: null, error: "Nilai opsi wajib diisi." };
  }
  if (value.length > MAX_OPTION_LENGTH) {
    return {
      data: null,
      error: `Nilai opsi maksimal ${MAX_OPTION_LENGTH} karakter.`,
    };
  }

  const supabase = createClient();
  const existing = await findMasterOption(supabase, input.category, value);
  if (existing) {
    return { data: null, error: "Nilai tersebut sudah ada di kategori ini." };
  }

  const { error } = await supabase.from("master_options").insert({
    category: input.category,
    value,
    is_active: input.isActive ?? true,
  });
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menambah opsi master."),
    };
  }

  return {
    data: {
      category: input.category,
      value,
      isActive: input.isActive ?? true,
    },
    error: null,
  };
}

/**
 * Ubah nama dan/atau status opsi. Rename ditolak jika opsi sudah dipakai,
 * karena FK komposit tidak memakai ON UPDATE CASCADE.
 */
export async function updateMasterOption(
  category: MasterOptionCategory,
  currentValue: string,
  input: Pick<MasterOptionInput, "value" | "isActive">
): Promise<ServiceResult<MasterOption>> {
  if (!isMasterOptionCategory(category)) {
    return { data: null, error: "Kategori master data tidak dikenal." };
  }
  const value = input.value.trim();
  if (value.length === 0) {
    return { data: null, error: "Nilai opsi wajib diisi." };
  }
  if (value.length > MAX_OPTION_LENGTH) {
    return {
      data: null,
      error: `Nilai opsi maksimal ${MAX_OPTION_LENGTH} karakter.`,
    };
  }

  const supabase = createClient();
  const current = await findMasterOption(supabase, category, currentValue);
  if (!current) {
    return { data: null, error: "Opsi master tidak ditemukan." };
  }
  const isActive = input.isActive ?? current.isActive;
  const renamed = value !== currentValue;

  if (renamed) {
    const existing = await findMasterOption(supabase, category, value);
    if (existing) {
      return { data: null, error: "Nilai tersebut sudah ada di kategori ini." };
    }
    const usage = await isMasterOptionInUse(category, currentValue);
    if (usage.error) {
      return { data: null, error: "Gagal memeriksa pemakaian opsi." };
    }
    if (usage.inUse) {
      return {
        data: null,
        error:
          "Opsi sedang dipakai modul lain. Nonaktifkan opsi lama lalu tambahkan nilai baru.",
      };
    }
  }

  const { error } = await supabase
    .from("master_options")
    .update({ value, is_active: isActive })
    .eq("category", category)
    .eq("value", currentValue);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal mengubah opsi master."),
    };
  }

  return {
    data: { category, value, isActive },
    error: null,
  };
}

export async function setMasterOptionActive(
  category: MasterOptionCategory,
  value: string,
  isActive: boolean
): Promise<ServiceResult<MasterOption>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("master_options")
    .update({ is_active: isActive })
    .eq("category", category)
    .eq("value", value);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal mengubah status opsi."),
    };
  }
  return { data: { category, value, isActive }, error: null };
}

/** Hapus hanya opsi yang belum dipakai. Opsi terpakai harus dinonaktifkan. */
export async function deleteMasterOption(
  category: MasterOptionCategory,
  value: string
): Promise<ServiceResult<null>> {
  const usage = await isMasterOptionInUse(category, value);
  if (usage.error) {
    return { data: null, error: "Gagal memeriksa pemakaian opsi." };
  }
  if (usage.inUse) {
    return {
      data: null,
      error:
        "Opsi sedang dipakai modul lain dan tidak bisa dihapus. Nonaktifkan opsi ini sebagai gantinya.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("master_options")
    .delete()
    .eq("category", category)
    .eq("value", value);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menghapus opsi master."),
    };
  }
  return { data: null, error: null };
}

/** Semua opsi (termasuk nonaktif) untuk halaman pengelolaan Super Admin. */
export async function listAllMasterOptions(): Promise<
  ServiceResult<MasterOption[]>
> {
  return listMasterOptions({ includeInactive: true });
}

export async function listTeamMembers(): Promise<ServiceResult<TeamMember[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, profile_id, name, status, created_at, updated_at")
    .order("name", { ascending: true });
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat tim/PIC.") };
  }
  return {
    data: ((data ?? []) as TeamMemberRow[])
      .map(toTeamMember)
      .filter((row): row is TeamMember => row !== null),
    error: null,
  };
}

async function findTeamMemberByName(
  supabase: BrowserSupabase,
  name: string
): Promise<TeamMember | null> {
  const { data } = await supabase
    .from("team_members")
    .select("id, profile_id, name, status, created_at, updated_at")
    .eq("name", name)
    .limit(1);
  const row = ((data ?? []) as TeamMemberRow[])[0];
  return row ? toTeamMember(row) : null;
}

export async function createTeamMember(
  input: TeamMemberInput
): Promise<ServiceResult<TeamMember>> {
  const name = input.name.trim();
  if (name.length === 0) {
    return { data: null, error: "Nama tim/PIC wajib diisi." };
  }
  if (name.length > MAX_TEAM_NAME_LENGTH) {
    return {
      data: null,
      error: `Nama tim/PIC maksimal ${MAX_TEAM_NAME_LENGTH} karakter.`,
    };
  }
  if (!isTeamMemberStatus(input.status)) {
    return { data: null, error: "Status tim/PIC tidak dikenal." };
  }

  const supabase = createClient();
  const existing = await findTeamMemberByName(supabase, name);
  if (existing) {
    return { data: null, error: "Nama tim/PIC tersebut sudah ada." };
  }

  const { error } = await supabase.from("team_members").insert({
    name,
    status: input.status,
  });
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menambah tim/PIC."),
    };
  }

  const created = await findTeamMemberByName(supabase, name);
  return created
    ? { data: created, error: null }
    : { data: null, error: "Tim/PIC tersimpan tetapi gagal dibaca ulang." };
}

export async function updateTeamMember(
  id: string,
  input: TeamMemberInput
): Promise<ServiceResult<TeamMember>> {
  const name = input.name.trim();
  if (name.length === 0) {
    return { data: null, error: "Nama tim/PIC wajib diisi." };
  }
  if (name.length > MAX_TEAM_NAME_LENGTH) {
    return {
      data: null,
      error: `Nama tim/PIC maksimal ${MAX_TEAM_NAME_LENGTH} karakter.`,
    };
  }
  if (!isTeamMemberStatus(input.status)) {
    return { data: null, error: "Status tim/PIC tidak dikenal." };
  }

  const supabase = createClient();
  const existing = await findTeamMemberByName(supabase, name);
  if (existing && existing.id !== id) {
    return { data: null, error: "Nama tim/PIC tersebut sudah ada." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ name, status: input.status })
    .eq("id", id);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal mengubah tim/PIC."),
    };
  }

  const updated = await findTeamMemberByName(supabase, name);
  return updated
    ? { data: updated, error: null }
    : { data: null, error: "Tim/PIC tersimpan tetapi gagal dibaca ulang." };
}

/**
 * Hapus anggota tim yang belum direferensikan. Anggota yang sudah dipakai
 * tidak dihapus agar penugasan lama tidak menjadi NULL (lihat Q-015).
 */
export async function deleteTeamMember(
  id: string
): Promise<ServiceResult<null>> {
  const usage = await isTeamMemberInUse(id);
  if (usage.error) {
    return { data: null, error: "Gagal memeriksa pemakaian tim/PIC." };
  }
  if (usage.inUse) {
    return {
      data: null,
      error:
        "Tim/PIC ini sudah dipakai pada data lain dan tidak bisa dihapus. Ubah namanya bila perlu.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) {
    return {
      data: null,
      error: errorMessage(error, "Gagal menghapus tim/PIC."),
    };
  }
  return { data: null, error: null };
}

/** Daftar tim/PIC untuk dropdown form. */
export async function listActiveTeamMembers(): Promise<
  ServiceResult<TeamMember[]>
> {
  return listTeamMembers();
}
