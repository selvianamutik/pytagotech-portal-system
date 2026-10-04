import { beforeEach, describe, expect, it } from "vitest";

import { resetMockIdeas } from "@/services/ideas";
import { resetMockMaterials } from "@/services/materials";
import {
  createPublication,
  deletePublication,
  getTargetPlatforms,
  getUncoveredPlatforms,
  listPublications,
  resetMockPublications,
} from "@/services/publications";

beforeEach(() => {
  resetMockIdeas();
  resetMockMaterials();
  resetMockPublications();
});

describe("publications", () => {
  it("membuat PUB-xxxx dari materi dengan pola", async () => {
    const created = await createPublication("MAT-0018", "Instagram", "Single");

    expect(created.error).toBeNull();
    expect(created.data?.id).toMatch(/^PUB-\d+$/);
    expect((await listPublications("MAT-0018")).data).toHaveLength(1);
  });

  it("menolak platform asing, pola asing, dan duplikat platform", async () => {
    expect((await createPublication("MAT-0018", "Friendster", "Single")).error).toMatch(
      /Platform/
    );
    expect((await createPublication("MAT-0018", "Instagram", "Ganda")).error).toMatch(/Pola/);
    await createPublication("MAT-0018", "Instagram", "Single");
    expect((await createPublication("MAT-0018", "Instagram", "Crosspost")).error).toMatch(
      /sudah ada/
    );
    expect((await deletePublication("PUB-9999")).error).toBe("Publikasi tidak ditemukan.");
  });

  it("rekonsiliasi: target dari ide, uncovered berkurang", async () => {
    // MAT-0018 ← IDE-001 (Instagram, TikTok).
    expect((await getTargetPlatforms("MAT-0018")).data).toEqual(["Instagram", "TikTok"]);
    expect((await getUncoveredPlatforms("MAT-0018")).data).toEqual(["Instagram", "TikTok"]);

    await createPublication("MAT-0018", "Instagram", "Crosspost");
    expect((await getUncoveredPlatforms("MAT-0018")).data).toEqual(["TikTok"]);

    expect((await deletePublication("PUB-0001")).error).toBeNull();
    expect((await getUncoveredPlatforms("MAT-0018")).data).toEqual(["Instagram", "TikTok"]);
  });
});
