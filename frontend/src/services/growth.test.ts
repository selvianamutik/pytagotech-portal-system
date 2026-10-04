import { beforeEach, describe, expect, it } from "vitest";

import { listGrowth, recordGrowth, resetMockGrowth } from "@/services/growth";
import { netGrowth } from "@/types/growth";

beforeEach(() => {
  resetMockGrowth();
});

describe("netGrowth", () => {
  it("(masuk − unfollows) ÷ awal", () => {
    expect(netGrowth({ followersStart: 10000, followersGained: 800, unfollows: 200 })).toBeCloseTo(6);
    expect(netGrowth({ followersStart: 0, followersGained: 10, unfollows: 0 })).toBe(0);
  });
});

describe("growth CRUD", () => {
  it("seed 2 baris + tambah + tolak duplikat bulan", async () => {
    expect((await listGrowth("Instagram")).data).toHaveLength(2);

    const result = await recordGrowth({
      platform: "TikTok",
      month: "2026-09",
      followersStart: 5000,
      followersGained: 700,
      unfollows: 100,
      reach: 90000,
      profileVisits: 3000,
    });
    expect(result.error).toBeNull();

    expect(
      (
        await recordGrowth({
          platform: "Instagram",
          month: "2026-09",
          followersStart: 1,
          followersGained: 1,
          unfollows: 0,
          reach: 1,
          profileVisits: 1,
        })
      ).error
    ).toMatch(/sudah ada/);
    expect(
      (
        await recordGrowth({
          platform: "Instagram",
          month: "2026-13",
          followersStart: 1,
          followersGained: 1,
          unfollows: 0,
          reach: 1,
          profileVisits: 1,
        })
      ).error
    ).toMatch(/YYYY-MM/);
  });
});
