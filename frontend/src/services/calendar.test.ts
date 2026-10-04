import { beforeEach, describe, expect, it } from "vitest";

import {
  getCalendarEntries,
  releaseUrgency,
  reschedulePublication,
  resetMockThresholds,
  setReleaseThresholds,
} from "@/services/calendar";
import { resetMockIdeas } from "@/services/ideas";
import { resetMockMaterials } from "@/services/materials";
import { createPublication, resetMockPublications } from "@/services/publications";
import { submitReview } from "@/services/approvals";

beforeEach(() => {
  resetMockIdeas();
  resetMockMaterials();
  resetMockPublications();
  resetMockThresholds();
});

describe("releaseUrgency", () => {
  it("ok bila terjadwal masa depan atau sudah rilis", () => {
    expect(releaseUrgency("2026-10-10", undefined, "2026-10-04T00:00:00Z", 24)).toBe("ok");
    expect(releaseUrgency("2026-10-01", "2026-10-01", "2026-10-05T00:00:00Z", 24)).toBe("ok");
    expect(releaseUrgency(undefined, undefined, "2026-10-05T00:00:00Z", 24)).toBe("ok");
  });

  it("overdue lalu kritis melewati ambang", () => {
    expect(releaseUrgency("2026-10-01", undefined, "2026-10-01T12:00:00Z", 24)).toBe("overdue");
    expect(releaseUrgency("2026-10-01", undefined, "2026-10-03T00:00:00Z", 24)).toBe("critical");
  });
});

describe("setReleaseThresholds", () => {
  it("menyimpan ambang valid dan menolak tak valid", async () => {
    expect((await setReleaseThresholds({ criticalHours: 48 })).data?.criticalHours).toBe(48);
    expect((await setReleaseThresholds({ criticalHours: 0 })).error).toMatch(/minimal 1 jam/);
  });
});

describe("getCalendarEntries", () => {
  it("bersumber dari distribusi + filter + urgensi", async () => {
    await createPublication("MAT-0018", "Instagram", "Single");
    const { savePublication } = await import("@/services/publications");
    const { listPublications } = await import("@/services/publications");
    const pub = (await listPublications("MAT-0018")).data![0]!;
    await savePublication({ ...pub, scheduleDate: "2026-10-01" });
    await submitReview("MAT-0018", {
      decision: "Disetujui Tanpa Revisi",
      reviewer: "Leader",
    });

    const all = await getCalendarEntries({}, "2026-10-05T00:00:00Z");
    expect(all.data).toHaveLength(1);
    expect(all.data?.[0]?.urgency).toBe("critical");
    expect(all.data?.[0]?.approval).toBe("Disetujui Tanpa Revisi");

    expect((await getCalendarEntries({ brand: "Pytafix" })).data).toHaveLength(0);
    expect((await getCalendarEntries({ platform: "TikTok" })).data).toHaveLength(0);
    expect(
      (await getCalendarEntries({ approval: "Disetujui Tanpa Revisi" })).data
    ).toHaveLength(1);
    expect((await getCalendarEntries({ gateReady: true })).data).toHaveLength(0);
  });
});

describe("reschedulePublication", () => {
  it("memindahkan jadwal dan menolak yang live", async () => {
    await createPublication("MAT-0018", "Instagram", "Single");
    const { listPublications, savePublication } = await import("@/services/publications");
    const pub = (await listPublications("MAT-0018")).data![0]!;
    await savePublication({ ...pub, scheduleDate: "2026-10-10" });

    expect((await reschedulePublication(pub.id, "2026-10-12")).error).toBeNull();
    expect((await listPublications("MAT-0018")).data?.[0]?.scheduleDate).toBe("2026-10-12");

    await savePublication({ ...pub, scheduleDate: "2026-10-12", releaseDate: "2026-10-12" });
    expect((await reschedulePublication(pub.id, "2026-10-15")).error).toMatch(/live/);
  });
});
