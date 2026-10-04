import { beforeEach, describe, expect, it } from "vitest";

import { listRevisions, submitReview } from "@/services/approvals";
import { getMaterial, resetMockMaterials } from "@/services/materials";

beforeEach(() => {
  resetMockMaterials();
});

describe("submitReview", () => {
  it("Disetujui mengubah status + nomor versi berurutan", async () => {
    const first = await submitReview("MAT-0018", {
      decision: "Disetujui dengan Revisi Minor",
      reviewer: "Leader",
      feedback: "Perbaiki cover.",
      evidenceLink: "https://drive.test/bukti",
    });

    expect(first.error).toBeNull();
    expect(first.data?.version).toBe(0);
    expect((await getMaterial("MAT-0018")).data?.status).toBe("Disetujui");

    const second = await submitReview("MAT-0018", {
      decision: "Disetujui Tanpa Revisi",
      reviewer: "Leader",
    });
    expect(second.data?.version).toBe(1);
    expect((await listRevisions("MAT-0018")).data).toHaveLength(2);
  });

  it("Ditolak wajib berumpan balik dan kembali Draf", async () => {
    expect(
      (await submitReview("MAT-0018", { decision: "Ditolak", reviewer: "Leader" })).error
    ).toMatch(/Umpan balik/);

    const rejected = await submitReview("MAT-0018", {
      decision: "Ditolak",
      reviewer: "Leader",
      feedback: "Hook lemah, ganti angle.",
    });
    expect(rejected.error).toBeNull();
    expect((await getMaterial("MAT-0018")).data?.status).toBe("Draf");
  });

  it("menolak keputusan dan reviewer tak valid", async () => {
    expect(
      (await submitReview("MAT-0018", { decision: "Mungkin", reviewer: "L" })).error
    ).toMatch(/Keputusan/);
    expect(
      (
        await submitReview("MAT-0018", {
          decision: "Disetujui Tanpa Revisi",
          reviewer: " ",
        })
      ).error
    ).toMatch(/reviewer/);
    expect(
      (await submitReview("MAT-9999", { decision: "Ditolak", reviewer: "L", feedback: "X" })).error
    ).toBe("Materi tidak ditemukan.");
  });
});
