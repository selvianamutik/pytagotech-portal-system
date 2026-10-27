/**
 * Kontrak master data & dropdown terpusat (US-005, FR-3).
 *
 * Delapan kelompok memakai tabel `master_options(category, value, is_active)`;
 * kelompok tim/PIC memakai tabel `team_members`. Halaman pengelolaan hanya
 * untuk Super Admin, sedangkan form cukup membaca opsi aktif.
 */

import { INTEREST_STAGES } from "@/types/interest";
import { FEATURE_PRIORITIES } from "@/types/feature";
import { INDUSTRY_CATEGORIES, LEAD_STATUSES } from "@/types/lead";
import { SOSMED_BRANDS, SOSMED_PLATFORMS } from "@/types/sosmed";

export const MASTER_OPTION_CATEGORIES = [
  "industry",
  "lead_status",
  "interest_stage",
  "brand",
  "platform",
  "pillar",
  "feature_category",
  "priority",
] as const;

export type MasterOptionCategory = (typeof MASTER_OPTION_CATEGORIES)[number];

export const MASTER_OPTION_GROUP_LABELS: Record<MasterOptionCategory, string> = {
  industry: "Kategori industri",
  lead_status: "Status lead",
  interest_stage: "Tahapan interest",
  brand: "Lini bisnis",
  platform: "Platform",
  pillar: "Pillar konten",
  feature_category: "Kategori fitur",
  priority: "Prioritas",
};

export const MASTER_OPTION_GROUP_DESCRIPTIONS: Record<
  MasterOptionCategory,
  string
> = {
  industry: "Pilihan kategori industri pada form lead dan filter CRM.",
  lead_status: "Status alur lead yang tampil di form dan filter CRM.",
  interest_stage: "Tahapan pipeline Interested Leads.",
  brand: "Lini bisnis Pytagotech Group untuk konten dan inquiry.",
  platform: "Platform distribusi dan sumber inquiry.",
  pillar: "Pillar konten untuk planner dan evaluasi strategi.",
  feature_category: "Kategori backlog fitur proyek.",
  priority: "Prioritas backlog fitur proyek.",
};

export interface MasterOption {
  category: MasterOptionCategory;
  value: string;
  isActive: boolean;
}

export interface MasterOptionInput {
  category: MasterOptionCategory;
  value: string;
  isActive?: boolean;
}

export const TEAM_MEMBER_STATUSES = ["internal", "external"] as const;

export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export interface TeamMember {
  id: string;
  profileId: string | null;
  name: string;
  status: TeamMemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberInput {
  name: string;
  status: TeamMemberStatus;
}

export type MasterOptionsByCategory = Record<MasterOptionCategory, string[]>;

export function isMasterOptionCategory(
  value: string
): value is MasterOptionCategory {
  return (MASTER_OPTION_CATEGORIES as readonly string[]).includes(value);
}

export function isTeamMemberStatus(value: string): value is TeamMemberStatus {
  return (TEAM_MEMBER_STATUSES as readonly string[]).includes(value);
}

/**
 * Nilai cadangan saat database belum bisa dibaca (mis. env belum diisi atau
 * sesi belum terbentuk). Sengaja mengikuti konstanta form yang sudah ada agar
 * aplikasi tetap bisa dipakai dalam mode demo.
 */
export function fallbackMasterOptions(): MasterOptionsByCategory {
  return {
    industry: [...INDUSTRY_CATEGORIES],
    lead_status: [...LEAD_STATUSES],
    interest_stage: [...INTEREST_STAGES],
    brand: [...SOSMED_BRANDS],
    platform: [...SOSMED_PLATFORMS],
    pillar: ["Edukasi", "Portofolio", "Promo", "Behind The Scene"],
    feature_category: ["Frontend", "Backend", "Integrasi", "UI/UX", "QA"],
    priority: [...FEATURE_PRIORITIES],
  };
}

/** Mengelompokkan baris `master_options` menjadi daftar nilai per kategori. */
export function groupMasterOptions(
  rows: Pick<MasterOption, "category" | "value">[]
): MasterOptionsByCategory {
  const groups = fallbackMasterOptions();
  for (const category of MASTER_OPTION_CATEGORIES) {
    groups[category] = [];
  }
  for (const row of rows) {
    groups[row.category].push(row.value);
  }
  return groups;
}
