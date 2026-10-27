import { createClient } from "@/lib/supabase/client";
import type { ServiceResult } from "@/services/result";
import {
  ARCHIVE_MODULES,
  isArchiveEntityType,
  type ArchiveCsvFile,
  type ArchiveEntityType,
  type ArchiveItem,
} from "@/types/archive";

/**
 * Arsip data & ekspor CSV (US-043, FR-5).
 *
 * Soft archive memakai RPC database `archive_entity`/`restore_entity`
 * (security invoker + cek Super Admin). Service memverifikasi ulang nilai
 * `archived_at` setelah RPC agar UI tidak menampilkan sukses palsu bila
 * baris tidak berubah. Ekspor CSV membaca seluruh baris modul — termasuk
 * yang sudah diarsipkan — sebagai cadangan logis di sisi aplikasi.
 */

type BrowserSupabase = ReturnType<typeof createClient>;

interface DbError {
  message: string;
  code?: string;
}

interface TeamMemberRow {
  id: string;
  name: string;
}

interface ClientRow {
  id: string;
  company_name: string;
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

interface ProjectRow {
  id: string;
  display_id: string;
  name: string;
  code: string;
  client_id: string;
  pm_id: string;
  start_date: string;
  target_date: string;
  value_idr: number | string;
  status: string;
  handover_id: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MaterialRow {
  id: string;
  display_id: string;
  title: string;
  brand: string;
  status: string;
  schedule_date: string | null;
  release_time: string | null;
  draft_link: string | null;
  copywriter_id: string | null;
  designer_id: string | null;
  video_editor_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

const LIST_LIMIT = 500;
const EXPORT_PAGE_SIZE = 1000;

const LEAD_COLUMNS =
  "id, display_id, contact_date, company_name, industry, whatsapp, instagram, email, pic_id, status, next_follow_up, source, archived_at, created_at, updated_at";
const PROJECT_COLUMNS =
  "id, display_id, name, code, client_id, pm_id, start_date, target_date, value_idr, status, handover_id, archived_at, created_at, updated_at";
const MATERIAL_COLUMNS =
  "id, display_id, title, brand, status, schedule_date, release_time, draft_link, copywriter_id, designer_id, video_editor_id, archived_at, created_at, updated_at";

function errorMessage(error: DbError | null, fallback: string): string {
  if (!error) {
    return fallback;
  }
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "Akun ini tidak berwenang mengarsipkan atau memulihkan data.";
  }
  if (error.code === "22023") {
    return error.message || "Jenis data tidak mendukung arsip.";
  }
  if (error.code === "PGRST116") {
    return "Data tidak ditemukan atau sudah berubah. Muat ulang halaman.";
  }
  return error.message || fallback;
}

function teamNames(rows: TeamMemberRow[]): Map<string, string> {
  return new Map(rows.map((row) => [row.id, row.name]));
}

function clientNames(rows: ClientRow[]): Map<string, string> {
  return new Map(rows.map((row) => [row.id, row.company_name]));
}

function mapLead(row: LeadRow, teams: Map<string, string>): ArchiveItem {
  const pic = row.pic_id ? teams.get(row.pic_id) : null;
  return {
    type: "lead",
    id: row.id,
    displayId: row.display_id,
    title: row.company_name,
    subtitle: [row.industry, pic ? `PIC ${pic}` : "Tanpa PIC", row.whatsapp]
      .filter((part) => part.trim().length > 0)
      .join(" · "),
    status: row.status,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(
  row: ProjectRow,
  teams: Map<string, string>,
  clients: Map<string, string>
): ArchiveItem {
  const pm = teams.get(row.pm_id);
  const client = clients.get(row.client_id);
  return {
    type: "project",
    id: row.id,
    displayId: row.display_id,
    title: row.name,
    subtitle: [
      row.code,
      client ?? "Klien tidak dikenal",
      pm ? `PM ${pm}` : "PM belum ditetapkan",
    ].join(" · "),
    status: row.status,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

function mapMaterial(
  row: MaterialRow,
  teams: Map<string, string>
): ArchiveItem {
  const schedule = row.schedule_date
    ? `Jadwal ${row.schedule_date}`
    : "Belum dijadwalkan";
  const copywriter = row.copywriter_id
    ? teams.get(row.copywriter_id)
    : undefined;
  return {
    type: "content_material",
    id: row.id,
    displayId: row.display_id,
    title: row.title,
    subtitle: [row.brand, schedule, copywriter ? `Copywriter ${copywriter}` : ""]
      .filter((part) => part.length > 0)
      .join(" · "),
    status: row.status,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

async function loadTeamNameMap(
  supabase: BrowserSupabase
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("team_members")
    .select("id, name")
    .limit(1000);
  return teamNames((data ?? []) as TeamMemberRow[]);
}

async function loadClientNameMap(
  supabase: BrowserSupabase
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("clients")
    .select("id, company_name")
    .limit(1000);
  return clientNames((data ?? []) as ClientRow[]);
}

/**
 * Daftar data arsip-able terbaru (maksimal 500 per modul). Pemisahan data
 * aktif/arsip dilakukan di UI agar satu kali muat cukup untuk kedua tab.
 */
export async function listArchiveItems(): Promise<ServiceResult<ArchiveItem[]>> {
  const supabase = createClient();
  const [leadResult, projectResult, materialResult, teams, clients] =
    await Promise.all([
      supabase
        .from("leads")
        .select(LEAD_COLUMNS)
        .order("updated_at", { ascending: false })
        .limit(LIST_LIMIT),
      supabase
        .from("projects")
        .select(PROJECT_COLUMNS)
        .order("updated_at", { ascending: false })
        .limit(LIST_LIMIT),
      supabase
        .from("content_materials")
        .select(MATERIAL_COLUMNS)
        .order("updated_at", { ascending: false })
        .limit(LIST_LIMIT),
      loadTeamNameMap(supabase),
      loadClientNameMap(supabase),
    ]);

  const failure: DbError | null =
    leadResult.error ?? projectResult.error ?? materialResult.error;
  if (failure) {
    return {
      data: null,
      error: errorMessage(failure, "Gagal memuat daftar data arsip."),
    };
  }

  const items = [
    ...((leadResult.data ?? []) as LeadRow[]).map((row) =>
      mapLead(row, teams)
    ),
    ...((projectResult.data ?? []) as ProjectRow[]).map((row) =>
      mapProject(row, teams, clients)
    ),
    ...((materialResult.data ?? []) as MaterialRow[]).map((row) =>
      mapMaterial(row, teams)
    ),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { data: items, error: null };
}

async function setArchiveState(
  type: ArchiveEntityType,
  entityId: string,
  archive: boolean
): Promise<ServiceResult<null>> {
  if (!isArchiveEntityType(type)) {
    return { data: null, error: "Jenis data tidak mendukung arsip." };
  }
  const id = entityId.trim();
  if (!id) {
    return { data: null, error: "ID data wajib diisi." };
  }

  const supabase = createClient();
  const action = archive ? "archive_entity" : "restore_entity";
  const { error } = await supabase.rpc(action, {
    entity_type: type,
    entity_id: id,
  });
  if (error) {
    return {
      data: null,
      error: errorMessage(
        error,
        archive ? "Gagal mengarsipkan data." : "Gagal memulihkan data."
      ),
    };
  }

  const table = ARCHIVE_MODULES[type].table;
  const { data, error: verifyError } = await supabase
    .from(table)
    .select("archived_at")
    .eq("id", id)
    .single();
  if (verifyError) {
    return {
      data: null,
      error:
        "Data tidak ditemukan atau gagal diverifikasi. Muat ulang halaman lalu coba lagi.",
    };
  }
  const archivedAt = (data as { archived_at: string | null } | null)
    ?.archived_at;
  if ((archivedAt !== null && archivedAt !== undefined) !== archive) {
    return {
      data: null,
      error: "Data tidak berubah. Muat ulang halaman; database mungkin menolak aksi ini.",
    };
  }

  return { data: null, error: null };
}

/** Arsipkan satu baris (soft archive) — khusus Super Admin (RLS + RPC). */
export function archiveRecord(
  type: ArchiveEntityType,
  entityId: string
): Promise<ServiceResult<null>> {
  return setArchiveState(type, entityId, true);
}

/** Pulihkan satu baris dari arsip. */
export function restoreRecord(
  type: ArchiveEntityType,
  entityId: string
): Promise<ServiceResult<null>> {
  return setArchiveState(type, entityId, false);
}

function csvCell(value: unknown): string {
  const text =
    value === null || value === undefined || value === "" ? "" : String(value);
  if (/[",\r\n]/.test(text) || /^\s|\s$/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Bangun CSV RFC 4180 dengan BOM UTF-8 agar rapi saat dibuka di Excel. */
export function buildCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[]
): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function archiveCsvFilename(
  type: ArchiveEntityType,
  date = new Date()
): string {
  const prefix = type === "content_material" ? "materi-konten" : type;
  return `${prefix}-${date.toISOString().slice(0, 10)}.csv`;
}

async function fetchAllRows<T>(
  supabase: BrowserSupabase,
  table: string,
  columns: string
): Promise<{ data: T[] | null; error: DbError | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += EXPORT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("display_id", { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1);
    if (error) {
      return { data: null, error };
    }
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) {
      break;
    }
  }
  return { data: rows, error: null };
}

/**
 * Ekspor satu modul ke CSV. Seluruh baris disertakan (aktif + arsip) dan
 * kolom "Diarsipkan" menunjukkan statusnya. Cocok untuk cadangan logis
 * sebelum restore atau audit data.
 */
export async function exportModuleCsv(
  type: ArchiveEntityType
): Promise<ServiceResult<ArchiveCsvFile>> {
  if (!isArchiveEntityType(type)) {
    return { data: null, error: "Modul ekspor tidak dikenal." };
  }
  const supabase = createClient();
  const [teams, clients] = await Promise.all([
    loadTeamNameMap(supabase),
    loadClientNameMap(supabase),
  ]);

  if (type === "lead") {
    const result = await fetchAllRows<LeadRow>(
      supabase,
      "leads",
      LEAD_COLUMNS
    );
    if (result.error || !result.data) {
      return {
        data: null,
        error: errorMessage(result.error, "Gagal memuat data lead untuk ekspor."),
      };
    }
    return {
      data: {
        filename: archiveCsvFilename(type),
        content: buildCsv(
          [
            "ID Lead",
            "Tanggal Hubungi",
            "Perusahaan",
            "Industri",
            "WhatsApp",
            "Instagram",
            "Email",
            "PIC",
            "Status",
            "Follow-up Berikutnya",
            "Sumber",
            "Diarsipkan",
            "Dibuat",
            "Diperbarui",
          ],
          result.data.map((row) => [
            row.display_id,
            row.contact_date,
            row.company_name,
            row.industry,
            row.whatsapp,
            row.instagram,
            row.email,
            row.pic_id ? teams.get(row.pic_id) ?? "" : "",
            row.status,
            row.next_follow_up,
            row.source,
            row.archived_at,
            row.created_at,
            row.updated_at,
          ])
        ),
      },
      error: null,
    };
  }

  if (type === "project") {
    const result = await fetchAllRows<ProjectRow>(
      supabase,
      "projects",
      PROJECT_COLUMNS
    );
    if (result.error || !result.data) {
      return {
        data: null,
        error: errorMessage(
          result.error,
          "Gagal memuat data proyek untuk ekspor."
        ),
      };
    }
    return {
      data: {
        filename: archiveCsvFilename(type),
        content: buildCsv(
          [
            "ID Proyek",
            "Kode",
            "Nama Proyek",
            "Klien",
            "PM",
            "Mulai",
            "Target Selesai",
            "Nilai (IDR)",
            "Status",
            "Handover",
            "Diarsipkan",
            "Dibuat",
            "Diperbarui",
          ],
          result.data.map((row) => [
            row.display_id,
            row.code,
            row.name,
            clients.get(row.client_id) ?? "",
            teams.get(row.pm_id) ?? "",
            row.start_date,
            row.target_date,
            row.value_idr,
            row.status,
            row.handover_id,
            row.archived_at,
            row.created_at,
            row.updated_at,
          ])
        ),
      },
      error: null,
    };
  }

  const result = await fetchAllRows<MaterialRow>(
    supabase,
    "content_materials",
    MATERIAL_COLUMNS
  );
  if (result.error || !result.data) {
    return {
      data: null,
      error: errorMessage(
        result.error,
        "Gagal memuat data materi konten untuk ekspor."
      ),
    };
  }
  return {
    data: {
      filename: archiveCsvFilename(type),
      content: buildCsv(
        [
          "ID Materi",
          "Judul",
          "Lini Bisnis",
          "Status",
          "Jadwal Tayang",
          "Jam Rilis",
          "Tautan Draf",
          "Copywriter",
          "Designer",
          "Video Editor",
          "Diarsipkan",
          "Dibuat",
          "Diperbarui",
        ],
        result.data.map((row) => [
          row.display_id,
          row.title,
          row.brand,
          row.status,
          row.schedule_date,
          row.release_time,
          row.draft_link,
          row.copywriter_id ? teams.get(row.copywriter_id) ?? "" : "",
          row.designer_id ? teams.get(row.designer_id) ?? "" : "",
          row.video_editor_id ? teams.get(row.video_editor_id) ?? "" : "",
          row.archived_at,
          row.created_at,
          row.updated_at,
        ])
      ),
    },
    error: null,
  };
}
