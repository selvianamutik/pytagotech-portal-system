import { beforeEach, describe, expect, it } from "vitest";

import { resetMockIdeas } from "@/services/ideas";
import { resetMockMaterials } from "@/services/materials";
import {
  createPublication,
  deletePublication,
  getTargetPlatforms,
  getUncoveredPlatforms,
  listPublications,
  recordRelease,
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

describe("recordRelease", () => {
  it("mencatat tanggal aktual + link live", async () => {
    await createPublication("MAT-0018", "Instagram", "Single");
    const pub = (await listPublications("MAT-0018")).data![0]!;

    const result = await recordRelease(pub.id, {
      releaseDate: "2026-10-05",
      liveLink: "https://instagram.test/p/abc",
    });

    expect(result.error).toBeNull();
    expect(result.data?.releaseDate).toBe("2026-10-05");
  });

  it("menolak tanggal/link tak valid dan id asing", async () => {
    await createPublication("MAT-0018", "Instagram", "Single");
    const pub = (await listPublications("MAT-0018")).data![0]!;

    expect(
      (await recordRelease(pub.id, { releaseDate: "kapan", liveLink: "https://x.test" })).error
    ).toMatch(/Tanggal aktual/);
    expect(
      (await recordRelease(pub.id, { releaseDate: "2026-10-05", liveLink: "  " })).error
    ).toMatch(/Link post live/);
    expect(
      (await recordRelease("PUB-9999", { releaseDate: "2026-10-05", liveLink: "https://x.test" }))
        .error
    ).toBe("Publikasi tidak ditemukan.");
  });
});
