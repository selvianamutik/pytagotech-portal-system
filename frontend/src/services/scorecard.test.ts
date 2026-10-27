import { beforeEach, describe, expect, it } from "vitest";

import { getScorecard } from "@/services/scorecard";
import { resetMockIdeas } from "@/services/ideas";
import { resetMockMaterials } from "@/services/materials";
import { createPublication, resetMockPublications } from "@/services/publications";
import { recordMetric, resetMockMetrics } from "@/services/metrics";
import { resetMockGrowth } from "@/services/growth";
import { resetMockInquiries } from "@/services/inquiries";

beforeEach(() => {
  resetMockIdeas();
  resetMockMaterials();
  resetMockPublications();
  resetMockMetrics();
  resetMockGrowth();
  resetMockInquiries();
});

describe("getScorecard", () => {
  it("6 KPI dengan target interim + status verifikasi", async () => {
    const { data } = await getScorecard({});

    expect(data).toHaveLength(6);
    expect(data?.map((kpi) => kpi.key)).toEqual([
      "production",
      "reach",
      "engagement",
      "growth",
      "footprint",
      "handover",
    ]);
    // Seed: 1 materi, 0 metrik, growth 2 baris IG, 1 inquiry routed.
    expect(data?.find((kpi) => kpi.key === "production")?.actual).toBe(1);
    expect(data?.find((kpi) => kpi.key === "handover")?.actual).toBe(1);
    expect(data?.find((kpi) => kpi.key === "growth")?.actual).toBe(
      (800 - 200) + (900 - 150)
    );
    expect(data?.find((kpi) => kpi.key === "reach")?.verified).toBe(false);
  });

  it("target per lini bisnis dari Pengaturan menimpa default secara parsial", async () => {
    const { data } = await getScorecard(
      { brand: "Pytagotech" },
      { kpiTargets: { Pytagotech: { production: 20, engagement: 4.5 } } }
    );

    expect(data?.find((kpi) => kpi.key === "production")?.target).toBe(20);
    expect(data?.find((kpi) => kpi.key === "engagement")?.target).toBe(4.5);
    expect(data?.find((kpi) => kpi.key === "reach")?.target).toBe(500000);
  });

  it("metrik Final memverifikasi KPI reach & engagement", async () => {
    const pub = await createPublication("MAT-0018", "Instagram", "Single");
    await recordMetric(
      pub.data!.id,
      { views: 1000, reach: 800, likes: 80, comments: 10, shares: 5, saves: 5, snapshot: "Final" },
      "Alya"
    );

    const { data } = await getScorecard({ brand: "Pytagotech" });
    expect(data?.find((kpi) => kpi.key === "reach")?.actual).toBe(800);
    expect(data?.find((kpi) => kpi.key === "reach")?.verified).toBe(true);
    expect(data?.find((kpi) => kpi.key === "engagement")?.actual).toBeCloseTo(
      ((80 + 10 + 5 + 5) / 800) * 100
    );

    // Filter brand lain mengosongkan KPI berbasis materi.
    const other = await getScorecard({ brand: "Pytafix" });
    expect(other.data?.find((kpi) => kpi.key === "production")?.actual).toBe(0);
  });
});
