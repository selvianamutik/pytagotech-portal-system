/**
 * Kontrak arsip data (US-043, FR-5).
 *
 * Soft archive hanya mengisi `archived_at`; tidak ada baris yang dihapus.
 * RPC `archive_entity`/`restore_entity` di database menjadi satu-satunya
 * jalur tulis, sehingga aturan Super Admin tetap ditegakkan di server.
 */

export const ARCHIVE_ENTITY_TYPES = [
  "lead",
  "project",
  "content_material",
] as const;

export type ArchiveEntityType = (typeof ARCHIVE_ENTITY_TYPES)[number];

export interface ArchiveModuleDefinition {
  type: ArchiveEntityType;
  /** Nama tabel asal di Supabase. */
  table: string;
  /** Label modul untuk tab, badge, dan pesan. */
  label: string;
  /** Nama entitas tunggal untuk kalimat aksi. */
  singular: string;
  description: string;
}

export const ARCHIVE_MODULES: Record<
  ArchiveEntityType,
  ArchiveModuleDefinition
> = {
  lead: {
    type: "lead",
    table: "leads",
    label: "Lead CRM",
    singular: "lead",
    description:
      "Lead lama yang sudah tidak aktif tetap tersimpan dan bisa dipulihkan.",
  },
  project: {
    type: "project",
    table: "projects",
    label: "Proyek",
    singular: "proyek",
    description:
      "Proyek selesai/dibatalkan dapat diarsipkan tanpa menghapus task dan riwayatnya.",
  },
  content_material: {
    type: "content_material",
    table: "content_materials",
    label: "Materi Konten",
    singular: "materi konten",
    description:
      "Materi lama keluar dari daftar produksi, tetapi tautan dan revisinya tetap utuh.",
  },
};

export interface ArchiveItem {
  type: ArchiveEntityType;
  /** UUID baris database. */
  id: string;
  /** Display ID ramah pengguna (LEAD-001, PRJ-001, MAT-0001). */
  displayId: string;
  title: string;
  subtitle: string;
  status: string;
  archivedAt: string | null;
  updatedAt: string;
}

export interface ArchiveModuleCount {
  active: number;
  archived: number;
}

export type ArchiveCounts = Record<ArchiveEntityType, ArchiveModuleCount>;

export interface ArchiveCsvFile {
  filename: string;
  /** Isi CSV siap unduh, sudah memakai BOM UTF-8. */
  content: string;
}

export function isArchiveEntityType(
  value: string
): value is ArchiveEntityType {
  return (ARCHIVE_ENTITY_TYPES as readonly string[]).includes(value);
}

export function archiveModuleLabel(type: ArchiveEntityType): string {
  return ARCHIVE_MODULES[type].label;
}

export function emptyArchiveCounts(): ArchiveCounts {
  return {
    lead: { active: 0, archived: 0 },
    project: { active: 0, archived: 0 },
    content_material: { active: 0, archived: 0 },
  };
}
