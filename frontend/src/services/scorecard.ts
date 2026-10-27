import { listMaterials } from "@/services/materials";
import { listMetrics } from "@/services/metrics";
import { engagementRate } from "@/types/metric";
import { listGrowth } from "@/services/growth";
import { listInquiries } from "@/services/inquiries";
import { listPublications } from "@/services/publications";
import type { ServiceResult } from "@/services/result";
import type { KpiTargetsByBrand } from "@/types/settings";
import { KPI_DEFINITIONS, resolveKpiTargets } from "@/types/settings";

/**
 * KPI Scorecard Sosmed (US-039). Target dibaca dari Pengaturan per lini
 * bisnis (US-041); bila brand belum diatur, nilai dasar dipakai. Status Data
 * Terverifikasi bila didukung snapshot Final, selain itu Monitoring Sementara.
 */

export type ScorecardKpiKey =
  | "production"
  | "reach"
  | "engagement"
  | "growth"
  | "footprint"
  | "handover";

export interface KpiTarget {
  key: ScorecardKpiKey;
  label: string;
  target: number;
  unit: string;
}

export interface KpiScore {
  key: ScorecardKpiKey;
  label: string;
  target: number;
  unit: string;
  actual: number;
  /** % capaian terhadap target. */
  achievement: number;
  verified: boolean;
}

export interface ScorecardFilter {
  brand?: string;
  /** Periode YYYY-MM (bulan data). Kosong = semua. */
  month?: string;
}

export interface ScorecardOptions {
  /** Target dari `settings.kpi.targets`; kosong = target dasar. */
  kpiTargets?: KpiTargetsByBrand;
}

function inMonth(dateIso: string, month: string): boolean {
  return dateIso.slice(0, 7) === month;
}

export async function getScorecard(
  filter: ScorecardFilter,
  options?: ScorecardOptions
): Promise<ServiceResult<KpiScore[]>> {
  const [{ data: materials }, { data: publications }, { data: metrics }, { data: growth }, { data: inquiries }] =
    await Promise.all([
      listMaterials(),
      listPublications(),
      listMetrics(),
      listGrowth(),
      listInquiries(),
    ]);

  const materialMap = new Map((materials ?? []).map((material) => [material.id, material]));
  const inBrand = (brand: string) => !filter.brand || brand === filter.brand;

  // 1. Production: materi dibuat pada periode + brand.
  const produced = (materials ?? []).filter(
    (material) =>
      inBrand(material.brand) && (!filter.month || inMonth(material.createdAt, filter.month))
  );

  // 2-3. Reach & ER dari metrik publikasi dalam brand/periode.
  const scopedMetrics = (metrics ?? []).filter((metric) => {
    const publication = (publications ?? []).find((item) => item.id === metric.publicationId);
    const material = publication ? materialMap.get(publication.materialId) : undefined;
    if (!material || !inBrand(material.brand)) {
      return false;
    }
    return !filter.month || inMonth(metric.createdAt, filter.month);
  });
  const reach = scopedMetrics.reduce((sum, metric) => sum + metric.reach, 0);
  const avgEr =
    scopedMetrics.length > 0
      ? scopedMetrics.reduce((sum, metric) => sum + engagementRate(metric), 0) / scopedMetrics.length
      : 0;
  const hasFinal = scopedMetrics.some((metric) => metric.snapshot === "Final");

  // 4-5. Growth & footprint dari data akun (level platform; brand tak berlaku).
  const growthRows = (growth ?? []).filter(
    (entry) => !filter.month || entry.month === filter.month
  );
  const netFollowers = growthRows.reduce(
    (sum, entry) => sum + (entry.followersGained - entry.unfollows),
    0
  );
  const latestByPlatform = new Map<string, (typeof growthRows)[number]>();
  for (const entry of growthRows) {
    const current = latestByPlatform.get(entry.platform);
    if (!current || entry.month > current.month) {
      latestByPlatform.set(entry.platform, entry);
    }
  }
  const footprint = [...latestByPlatform.values()].reduce(
    (sum, entry) => sum + entry.followersStart + entry.followersGained - entry.unfollows,
    0
  );

  // 6. Handover WA: inquiry yang dialihkan pada periode.
  const handovers = (inquiries ?? []).filter(
    (inquiry) =>
      inquiry.routedAt && (!filter.month || inMonth(inquiry.routedAt, filter.month))
  ).length;

  const actuals: Record<ScorecardKpiKey, { value: number; verified: boolean }> = {
    production: { value: produced.length, verified: produced.length > 0 },
    reach: { value: reach, verified: hasFinal },
    engagement: { value: Math.round(avgEr * 100) / 100, verified: hasFinal },
    growth: { value: netFollowers, verified: growthRows.length > 0 },
    footprint: { value: footprint, verified: growthRows.length > 0 },
    handover: { value: handovers, verified: handovers > 0 },
  };

  const targets = resolveKpiTargets(options?.kpiTargets ?? {}, filter.brand);

  return {
    data: KPI_DEFINITIONS.map((definition) => {
      const actual = actuals[definition.key];
      const target = targets[definition.key];
      return {
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        target,
        actual: actual.value,
        achievement: target > 0 ? (actual.value / target) * 100 : 0,
        verified: actual.verified,
      };
    }),
    error: null,
  };
}
