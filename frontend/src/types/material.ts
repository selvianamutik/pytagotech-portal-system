import type { SosmedBrand } from "@/types/sosmed";

/**
 * Kontrak materi konten induk (US-028 s.d. US-030).
 * ID MAT-xxxx otomatis (DEC-006). Quality gate (US-029), approval &
 * revisi (US-030) menempel di tipe ini.
 * Fase 1: mock; Fase 2: tabel `content_materials` (+ `content_revisions`).
 */

/** Status materi: alur Draf → Produksi → Review → Disetujui → Jadwal → Rilis. */
export const MATERIAL_STATUSES = [
  "Draf",
  "Disetujui",
  "Dijadwalkan",
  "Rilis",
] as const;

export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

/** 5 item checklist quality gate pra-rilis (US-029). */
export const QUALITY_GATE_ITEMS = [
  "rasio visual",
  "lisensi audio",
  "brand cover",
  "link bio/CTA",
  "proofread copy",
] as const;

export type QualityGateItem = (typeof QUALITY_GATE_ITEMS)[number];

export interface ContentMaterial {
  /** Display ID MAT-xxxx otomatis. */
  id: string;
  title: string;
  brand: SosmedBrand;
  status: MaterialStatus;
  /** Jadwal tayang (YYYY-MM-DD) + jam rilis (HH:MM). */
  scheduleDate?: string;
  releaseTime?: string;
  draftLink: string;
  copywriter: string;
  designer: string;
  videoEditor: string;
  /** Ide asal (bila dibuat dari planner). */
  ideaId?: string;
  /** Checklist quality gate per item. */
  qualityGate: Record<QualityGateItem, boolean>;
  /** Pengecualian Admin atas gate (US-029). */
  gateOverride?: { by: string; reason: string };
  createdAt: string;
}

export interface MaterialInput {
  title: string;
  brand: string;
  draftLink: string;
  copywriter: string;
  designer: string;
  videoEditor: string;
  scheduleDate?: string;
  releaseTime?: string;
}

export function isMaterialStatus(value: string): value is MaterialStatus {
  return (MATERIAL_STATUSES as readonly string[]).includes(value);
}

export function isQualityGateComplete(gate: Record<QualityGateItem, boolean>): boolean {
  return (Object.keys(gate) as QualityGateItem[]).every((item) => gate[item]);
}
