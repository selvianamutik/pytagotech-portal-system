import { beforeEach, describe, expect, it } from "vitest";

import { resetMockIdeas } from "@/services/ideas";
import {
  createMaterial,
  createMaterialFromIdea,
  listMaterials,
  resetMockMaterials,
} from "@/services/materials";

beforeEach(() => {
  resetMockIdeas();
  resetMockMaterials();
});

describe("materials", () => {
  it("seed 1 materi + tambah dengan ID otomatis", async () => {
    expect((await listMaterials()).data).toHaveLength(1);
    const result = await createMaterial({
      title: "Video explainer",
      brand: "Pytafix",
      draftLink: "",
      copywriter: "Alya",
      designer: "",
      videoEditor: "Bagas",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^MAT-\d+$/);
    expect(result.data?.status).toBe("Draf");
  });

  it("menolak brand asing dan jam salah format", async () => {
    expect(
      (
        await createMaterial({
          title: "X", brand: "Y", draftLink: "", copywriter: "", designer: "", videoEditor: "",
        })
      ).error
    ).toMatch(/Lini bisnis/);
    expect(
      (
        await createMaterial({
          title: "X", brand: "Pytagotech", draftLink: "", copywriter: "", designer: "", videoEditor: "", releaseTime: "25:00",
        })
      ).error
    ).toMatch(/Jam rilis/);
  });

  it("dari ide: hanya Disetujui/Siap Produksi", async () => {
    const ok = await createMaterialFromIdea("IDE-001");

    expect(ok.error).toBeNull();
    expect(ok.data?.ideaId).toBe("IDE-001");

    expect((await createMaterialFromIdea("IDE-002")).error).toMatch(/Disetujui/);
    expect((await createMaterialFromIdea("IDE-999")).error).toBe("Ide tidak ditemukan.");
  });
});
