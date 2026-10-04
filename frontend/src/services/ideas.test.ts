import { beforeEach, describe, expect, it } from "vitest";

import { briefScore } from "@/types/content-idea";
import {
  createIdea,
  listIdeas,
  readinessAllowed,
  resetMockIdeas,
  updateIdea,
} from "@/services/ideas";
import type { IdeaInput } from "@/types/content-idea";

const fullBrief = {
  hook: "H",
  angle: "A",
  keyPoints: "K",
  cta: "C",
  assetRef: "AST-1",
};

const validInput: IdeaInput = {
  title: "Ide Bagus",
  brand: "Pytabelajar",
  pillar: "Edukasi",
  funnel: "Awareness",
  targetPlatforms: ["TikTok"],
  brief: fullBrief,
  readiness: "Tahan - Perlu Verifikasi",
};

beforeEach(() => {
  resetMockIdeas();
});

describe("briefScore", () => {
  it("menghitung field terisi", () => {
    expect(briefScore(fullBrief)).toBe(5);
    expect(briefScore({ ...fullBrief, hook: " ", cta: "" })).toBe(3);
  });

  it("ambang Siap Masuk Produksi = 5/5", () => {
    expect(readinessAllowed("Siap Masuk Produksi", 5)).toBeNull();
    expect(readinessAllowed("Siap Masuk Produksi", 4)).toMatch(/5\/5/);
    expect(readinessAllowed("Ditunda", 1)).toBeNull();
  });
});

describe("ideas CRUD", () => {
  it("seed 2 ide + tambah valid", async () => {
    expect((await listIdeas()).data).toHaveLength(2);
    const result = await createIdea(validInput);

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^IDE-\d+$/);
  });

  it("menolak Siap Produksi berskor rendah dan field tak valid", async () => {
    expect(
      (
        await createIdea({
          ...validInput,
          readiness: "Siap Masuk Produksi",
          brief: { ...fullBrief, cta: "" },
        })
      ).error
    ).toMatch(/5\/5/);
    expect((await createIdea({ ...validInput, brand: "X" })).error).toMatch(/Lini bisnis/);
    expect((await createIdea({ ...validInput, targetPlatforms: [] })).error).toMatch(
      /platform target/
    );
    expect((await updateIdea("IDE-999", validInput)).error).toBe("Ide tidak ditemukan.");
  });
});
