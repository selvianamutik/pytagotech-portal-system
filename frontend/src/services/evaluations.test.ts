import { beforeEach, describe, expect, it } from "vitest";

import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
  resetMockEvaluations,
} from "@/services/evaluations";

beforeEach(() => {
  resetMockEvaluations();
});

describe("evaluations", () => {
  it("seed + filter kategori/brand/periode", async () => {
    expect((await listEvaluations()).data).toHaveLength(1);
    expect((await listEvaluations({ category: "Test" })).data).toHaveLength(0);
    expect((await listEvaluations({ brand: "Pytagotech", period: "2026-09" })).data).toHaveLength(1);
  });

  it("Test wajib berhipotesis; non-Test bebas", async () => {
    expect(
      (
        await createEvaluation({
          category: "Test",
          pillar: "Edukasi",
          format: "Reels",
          brand: "Pytagotech",
          period: "2026-10",
          summary: "Coba hook baru.",
          evidence: "ER stagnan.",
        })
      ).error
    ).toMatch(/hipotesis/);

    const ok = await createEvaluation({
      category: "Test",
      pillar: "Edukasi",
      format: "Reels",
      brand: "Pytagotech",
      period: "2026-10",
      summary: "Coba hook baru.",
      evidence: "ER stagnan.",
      hypothesis: "Hook pertanyaan menaikkan tonton 20%.",
      actionPlan: "3 Reels/minggu.",
      successTarget: "ER ≥ 3,5%.",
      businessImpact: "Lead +10%.",
    });
    expect(ok.error).toBeNull();
    expect(ok.data?.hypothesis).toMatch(/pertanyaan/);

    expect((await deleteEvaluation(ok.data!.id)).error).toBeNull();
    expect((await deleteEvaluation("EVL-999")).error).toBe("Evaluasi tidak ditemukan.");
  });
});
