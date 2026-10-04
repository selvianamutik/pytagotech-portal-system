/**
 * Kontrak evaluasi strategi KIST (US-040, FR-29).
 * Kategori Test wajib berhipotesis (hipotesis, rencana, target,
 * dampak, hasil). Fase 1: mock; Fase 2: tabel `strategy_evaluations`.
 */
export const KIST_CATEGORIES = ["Keep", "Improve", "Stop", "Test"] as const;

export type KistCategory = (typeof KIST_CATEGORIES)[number];

export interface StrategyEvaluation {
  id: string;
  category: KistCategory;
  /** Pillar/format tertaut (teks bebas). */
  pillar: string;
  format: string;
  brand: string;
  /** Periode evaluasi YYYY-MM. */
  period: string;
  summary: string;
  /** Data pendukung. */
  evidence: string;
  hypothesis?: string;
  actionPlan?: string;
  successTarget?: string;
  businessImpact?: string;
  result?: string;
  createdAt: string;
}

export interface EvaluationInput {
  category: string;
  pillar: string;
  format: string;
  brand: string;
  period: string;
  summary: string;
  evidence: string;
  hypothesis?: string;
  actionPlan?: string;
  successTarget?: string;
  businessImpact?: string;
  result?: string;
}

export function isKistCategory(value: string): value is KistCategory {
  return (KIST_CATEGORIES as readonly string[]).includes(value);
}
