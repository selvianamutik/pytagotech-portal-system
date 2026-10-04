import { beforeEach, describe, expect, it } from "vitest";

import { engagementRate, ER_FORMULA } from "@/types/metric";
import {
  deleteMetric,
  listMetrics,
  recordMetric,
  resetMockMetrics,
  updateMetric,
} from "@/services/metrics";
import { createPublication, resetMockPublications } from "@/services/publications";
import { resetMockIdeas } from "@/services/ideas";
import { resetMockMaterials } from "@/services/materials";

const input = {
  views: 10000,
  reach: 8000,
  likes: 400,
  comments: 50,
  shares: 30,
  saves: 20,
  snapshot: "Monitoring" as const,
};

beforeEach(() => {
  resetMockIdeas();
  resetMockMaterials();
  resetMockPublications();
  resetMockMetrics();
});

async function seedPub(): Promise<string> {
  const created = await createPublication("MAT-0018", "Instagram", "Single");
  return created.data!.id;
}

describe("engagementRate", () => {
  it("Q-002 C: engagement ÷ reach", () => {
    expect(engagementRate(input)).toBeCloseTo(((400 + 50 + 30 + 20) / 8000) * 100);
    expect(engagementRate({ ...input, reach: 0 })).toBe(0);
    expect(ER_FORMULA).toMatch(/Reach/);
  });
});

describe("recordMetric", () => {
  it("mencatat metrik per publikasi", async () => {
    const pubId = await seedPub();
    const result = await recordMetric(pubId, input, "Alya");

    expect(result.error).toBeNull();
    expect((await listMetrics(pubId)).data).toHaveLength(1);
    expect((await recordMetric("PUB-9999", input, "Alya")).error).toBe(
      "Publikasi tidak ditemukan."
    );
  });

  it("menolak angka negatif dan deduplikasi Final", async () => {
    const pubId = await seedPub();
    expect(
      (await recordMetric(pubId, { ...input, likes: -1 }, "Alya")).error
    ).toMatch(/Likes/);

    expect((await recordMetric(pubId, { ...input, snapshot: "Final" }, "Alya")).error).toBeNull();
    expect(
      (await recordMetric(pubId, { ...input, snapshot: "Final" }, "Alya")).error
    ).toMatch(/sudah memiliki/);
  });
});

describe("kunci Final", () => {
  it("hanya role diizinkan yang boleh ubah/hapus Final", async () => {
    const pubId = await seedPub();
    const created = await recordMetric(pubId, { ...input, snapshot: "Final" }, "Alya");

    expect(
      (await updateMetric(created.data!.id, { ...input, likes: 500 }, ["Social Media Specialist"])).error
    ).toMatch(/terkunci/);
    const ok = await updateMetric(
      created.data!.id,
      { ...input, likes: 500, snapshot: "Final" },
      ["Executive / Leader"]
    );
    expect(ok.error).toBeNull();
    expect(ok.data?.likes).toBe(500);

    const delDenied = await deleteMetric(created.data!.id, ["Developer"]);
    expect(delDenied.error).toMatch(/terkunci/);
    expect((await deleteMetric(created.data!.id, ["Super Admin"])).error).toBeNull();
  });
});
