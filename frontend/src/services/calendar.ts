import { listMaterials } from "@/services/materials";
import { listPublications, savePublication } from "@/services/publications";
import { listRevisions } from "@/services/approvals";
import { isQualityGateComplete } from "@/types/material";
import type { ServiceResult } from "@/services/result";

/**
 * Kalender publikasi (US-032, FR-24) + ambang overdue/kritis (Q-004 B).
 * Ambang default = nilai opsi A (overdue: lewat jadwal; kritis: >24 jam)
 * dan dapat dikonfigurasi (penuh di halaman Pengaturan US-041).
 */

export interface ReleaseThresholds {
  /** Jam keterlambatan sebelum Kritis (Overdue = lewat jadwal >0). */
  criticalHours: number;
}

let thresholdsStore: ReleaseThresholds = { criticalHours: 24 };

/** Mengembalikan ambang ke default — dipakai test. */
export function resetMockThresholds(): void {
  thresholdsStore = { criticalHours: 24 };
}

export async function getReleaseThresholds(): Promise<ServiceResult<ReleaseThresholds>> {
  return { data: { ...thresholdsStore }, error: null };
}

export async function setReleaseThresholds(
  thresholds: ReleaseThresholds
): Promise<ServiceResult<ReleaseThresholds>> {
  if (!Number.isFinite(thresholds.criticalHours) || thresholds.criticalHours < 1) {
    return { data: null, error: "Ambang kritis minimal 1 jam." };
  }
  thresholdsStore = { criticalHours: Math.round(thresholds.criticalHours) };
  return { data: { ...thresholdsStore }, error: null };
}

export type ReleaseUrgency = "ok" | "overdue" | "critical";

/** Status keterlambatan publikasi terhadap jadwal + jam kini. */
export function releaseUrgency(
  scheduleDate: string | undefined,
  releaseDate: string | undefined,
  nowIso: string,
  criticalHours: number
): ReleaseUrgency {
  if (!scheduleDate || releaseDate) {
    return "ok";
  }
  const lateMs = new Date(nowIso).getTime() - new Date(`${scheduleDate}T00:00:00Z`).getTime();
  if (lateMs <= 0) {
    return "ok";
  }
  return lateMs > criticalHours * 60 * 60 * 1000 ? "critical" : "overdue";
}

export interface CalendarEntry {
  publicationId: string;
  materialId: string;
  materialTitle: string;
  brand: string;
  platform: string;
  scheduleDate: string;
  isLive: boolean;
  /** Keputusan approval terakhir (atau "Belum direview"). */
  approval: string;
  gateReady: boolean;
  urgency: ReleaseUrgency;
}

export interface CalendarFilter {
  brand?: string;
  platform?: string;
  approval?: string;
  gateReady?: boolean;
}

/** Entri kalender dari data distribusi + filter multi-parameter. */
export async function getCalendarEntries(
  filter: CalendarFilter,
  nowIso: string = new Date().toISOString()
): Promise<ServiceResult<CalendarEntry[]>> {
  const [{ data: publications }, { data: materials }] = await Promise.all([
    listPublications(),
    listMaterials(),
  ]);
  const materialMap = new Map((materials ?? []).map((material) => [material.id, material]));
  const entries: CalendarEntry[] = [];
  for (const publication of publications ?? []) {
    const material = materialMap.get(publication.materialId);
    if (!material || !publication.scheduleDate) {
      continue;
    }
    const { data: revisions } = await listRevisions(material.id);
    const approval = revisions?.length
      ? (revisions[revisions.length - 1]?.decision as string)
      : "Belum direview";
    const gateReady = isQualityGateComplete(material.qualityGate);
    if (filter.brand && material.brand !== filter.brand) {
      continue;
    }
    if (filter.platform && publication.platform !== filter.platform) {
      continue;
    }
    if (filter.approval && approval !== filter.approval) {
      continue;
    }
    if (filter.gateReady !== undefined && gateReady !== filter.gateReady) {
      continue;
    }
    entries.push({
      publicationId: publication.id,
      materialId: material.id,
      materialTitle: material.title,
      brand: material.brand,
      platform: publication.platform,
      scheduleDate: publication.scheduleDate,
      isLive: Boolean(publication.releaseDate),
      approval,
      gateReady,
      urgency: releaseUrgency(
        publication.scheduleDate,
        publication.releaseDate,
        nowIso,
        thresholdsStore.criticalHours
      ),
    });
  }
  return {
    data: entries.sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate)),
    error: null,
  };
}

/** Jadwal ulang via seret (US-032): hanya bila belum live. */
export async function reschedulePublication(
  publicationId: string,
  newDate: string
): Promise<ServiceResult<true>> {
  if (!newDate || Number.isNaN(Date.parse(newDate))) {
    return { data: null, error: "Tanggal baru tidak valid." };
  }
  const { data: publications } = await listPublications();
  const publication = (publications ?? []).find((item) => item.id === publicationId);
  if (!publication) {
    return { data: null, error: "Publikasi tidak ditemukan." };
  }
  if (publication.releaseDate) {
    return { data: null, error: "Publikasi yang sudah live tidak dapat dijadwal ulang." };
  }
  await savePublication({ ...publication, scheduleDate: newDate });
  return { data: true, error: null };
}
