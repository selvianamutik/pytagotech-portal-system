import type { EvaluationInput, StrategyEvaluation } from "@/types/evaluation";
import { isKistCategory } from "@/types/evaluation";
import { isSosmedBrand } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/** Lapisan evaluasi strategi KIST (US-040, FR-29). */

let evaluationStore: StrategyEvaluation[] = [
  {
    id: "EVL-001",
    category: "Keep",
    pillar: "Edukasi",
    format: "Carousel",
    brand: "Pytagotech",
    period: "2026-09",
    summary: "Carousel edukasi API konsisten di atas rata-rata ER.",
    evidence: "ER 4,2% vs rata-rata 2,8% (5 posting).",
    createdAt: "2026-10-01T02:00:00Z",
  },
];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockEvaluations(): void {
  evaluationStore = [
    {
      id: "EVL-001",
      category: "Keep",
      pillar: "Edukasi",
      format: "Carousel",
      brand: "Pytagotech",
      period: "2026-09",
      summary: "Carousel edukasi API konsisten di atas rata-rata ER.",
      evidence: "ER 4,2% vs rata-rata 2,8% (5 posting).",
      createdAt: "2026-10-01T02:00:00Z",
    },
  ];
}

function validateEvaluationInput(input: EvaluationInput): string | null {
  if (!isKistCategory(input.category)) {
    return "Kategori harus Keep, Improve, Stop, atau Test.";
  }
  if (input.pillar.trim().length === 0) {
    return "Pillar/format tertaut wajib diisi.";
  }
  if (!isSosmedBrand(input.brand)) {
    return "Lini bisnis tidak dikenal.";
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.period)) {
    return "Periode harus format YYYY-MM.";
  }
  if (input.summary.trim().length === 0) {
    return "Ringkasan evaluasi wajib diisi.";
  }
  if (input.category === "Test" && !(input.hypothesis ?? "").trim()) {
    return "Kategori Test wajib memiliki hipotesis.";
  }
  return null;
}

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : undefined;
}

export interface EvaluationQuery {
  category?: string;
  brand?: string;
  period?: string;
}

export async function listEvaluations(
  query: EvaluationQuery = {}
): Promise<ServiceResult<StrategyEvaluation[]>> {
  return {
    data: evaluationStore
      .filter(
        (evaluation) =>
          (!query.category || evaluation.category === query.category) &&
          (!query.brand || evaluation.brand === query.brand) &&
          (!query.period || evaluation.period === query.period)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((evaluation) => ({ ...evaluation })),
    error: null,
  };
}

export async function createEvaluation(
  input: EvaluationInput
): Promise<ServiceResult<StrategyEvaluation>> {
  const validationError = validateEvaluationInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const evaluation: StrategyEvaluation = {
    id: `EVL-${String(evaluationStore.length + 1).padStart(3, "0")}`,
    category: input.category as StrategyEvaluation["category"],
    pillar: input.pillar.trim(),
    format: input.format.trim(),
    brand: input.brand,
    period: input.period,
    summary: input.summary.trim(),
    evidence: input.evidence.trim(),
    hypothesis: trimOptional(input.hypothesis),
    actionPlan: trimOptional(input.actionPlan),
    successTarget: trimOptional(input.successTarget),
    businessImpact: trimOptional(input.businessImpact),
    result: trimOptional(input.result),
    createdAt: new Date().toISOString(),
  };
  evaluationStore.push(evaluation);
  return { data: { ...evaluation }, error: null };
}

export async function deleteEvaluation(evaluationId: string): Promise<ServiceResult<true>> {
  const index = evaluationStore.findIndex((item) => item.id === evaluationId);
  if (index === -1) {
    return { data: null, error: "Evaluasi tidak ditemukan." };
  }
  evaluationStore.splice(index, 1);
  return { data: true, error: null };
}
