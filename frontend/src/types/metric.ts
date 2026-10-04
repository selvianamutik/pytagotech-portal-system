/**
 * Kontrak metrik posting (US-035, FR-25).
 * Engagement Rate = (Likes + Comments + Shares + Saves) ÷ Reach × 100%
 * (jawaban Q-002 opsi C). Snapshot Final: satu per publikasi, terkunci
 * kecuali Super Admin / Leader / Executive (jawaban Q-007 opsi B).
 * Fase 1: mock; Fase 2: tabel `post_metrics`.
 */
export const METRIC_SNAPSHOTS = ["Monitoring", "Final"] as const;

export type MetricSnapshot = (typeof METRIC_SNAPSHOTS)[number];

/** Role yang boleh mengubah snapshot Final yang terkunci. */
export const FINAL_UNLOCK_ROLES = ["Super Admin", "Executive / Leader"] as const;

export interface PostMetric {
  id: string;
  publicationId: string;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  snapshot: MetricSnapshot;
  recordedBy: string;
  createdAt: string;
}

export interface MetricInput {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  snapshot: MetricSnapshot;
}

/** ER dalam persen (0–...). Reach 0 → 0. */
export function engagementRate(metric: {
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}): number {
  if (metric.reach <= 0) {
    return 0;
  }
  return (
    ((metric.likes + metric.comments + metric.shares + metric.saves) / metric.reach) * 100
  );
}

export const ER_FORMULA = "ER = (Likes + Comments + Shares + Saves) ÷ Reach × 100%";
