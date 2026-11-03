import { beforeEach, describe, expect, it } from "vitest";

import {
  getSlaCompliance,
  isSlaMet,
  markInteractionReplied,
  recordInteraction,
  resetMockInteractions,
  responseMinutes,
} from "@/services/community";

beforeEach(() => {
  resetMockInteractions();
});

describe("responseMinutes", () => {
  it("menghitung menit dan null bila belum dibalas", () => {
    expect(
      responseMinutes({ receivedAt: "2026-10-04T01:00:00Z", repliedAt: "2026-10-04T01:18:00Z" })
    ).toBe(18);
    expect(responseMinutes({ receivedAt: "2026-10-04T01:00:00Z", repliedAt: null })).toBeNull();
    expect(
      isSlaMet({ receivedAt: "2026-10-04T01:00:00Z", repliedAt: "2026-10-04T01:18:00Z" })
    ).toBe(true);
    expect(
      isSlaMet({ receivedAt: "2026-10-04T01:00:00Z", repliedAt: "2026-10-04T01:45:00Z" })
    ).toBe(false);
  });
});

describe("recordInteraction", () => {
  it("mencatat dan menolak waktu invalid", async () => {
    const result = await recordInteraction({
      channel: "DM",
      platform: "Instagram",
      brand: "Pytagotech",
      type: "Spam",
      receivedAt: "2026-10-04T03:00:00Z",
      handler: "Alya",
    });

    expect(result.error).toBeNull();
    expect(
      (
        await recordInteraction({
          channel: "email",
          platform: "Instagram",
          brand: "Pytagotech",
          type: "Spam",
          receivedAt: "2026-10-04T03:00:00Z",
          handler: "Alya",
        })
      ).error
    ).toMatch(/Kanal/);
    expect(
      (
        await recordInteraction({
          channel: "DM",
          platform: "Instagram",
          brand: "Pytagotech",
          type: "Spam",
          receivedAt: "2026-10-04T03:00:00Z",
          repliedAt: "2026-10-04T02:00:00Z",
          handler: "Alya",
        })
      ).error
    ).toMatch(/sebelum waktu masuk/);
  });
});

describe("markInteractionReplied + compliance", () => {
  it("menandai dibalas dan menghitung % SLA", async () => {
    // INT-001: 18 mnt (tercapai); INT-002: balas 40 mnt (tidak).
    await markInteractionReplied("INT-002", "2026-10-04T02:40:00Z");
    const compliance = await getSlaCompliance();

    expect(compliance.data).toEqual({ answered: 2, met: 1, percent: 50 });
    expect((await markInteractionReplied("INT-999", "2026-10-04T02:40:00Z")).error).toBe(
      "Interaksi tidak ditemukan."
    );
  });
});
