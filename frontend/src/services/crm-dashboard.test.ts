import { describe, expect, it } from "vitest";

import { getCrmDashboard, resolvePeriod } from "@/services/crm-dashboard";

describe("resolvePeriod", () => {
  it("mode harian memakai hari ini (WIB)", () => {
    const range = resolvePeriod({ mode: "daily" });

    expect(range.from).toBe(range.to);
    expect(range.label).toBe("Harian");
  });

  it("mode bulanan mencakup 1 s.d. akhir bulan berjalan", () => {
    const range = resolvePeriod({ mode: "monthly" });

    expect(range.from.endsWith("-01")).toBe(true);
    expect(range.from.slice(0, 7)).toBe(range.to.slice(0, 7));
  });

  it("mode kustom menukar bila dari > sampai", () => {
    const range = resolvePeriod({ mode: "custom", from: "2026-10-10", to: "2026-10-01" });

    expect(range.from).toBe("2026-10-01");
    expect(range.to).toBe("2026-10-10");
  });
});

describe("getCrmDashboard", () => {
  it("menghitung KPI periode September 2026", async () => {
    const { data } = await getCrmDashboard({
      mode: "custom",
      from: "2026-09-01",
      to: "2026-09-30",
    });

    // 7 dari 8 mock lead dihubungi September (LEAD-008 Oktober).
    expect(data?.kpi.totalLeads).toBe(8);
    expect(data?.kpi.outreach).toBe(7);
    expect(data?.kpi.newCount).toBe(1);
    expect(data?.kpi.followUp).toBe(1);
    expect(data?.kpi.interested).toBe(2);
    expect(data?.kpi.closing).toBe(1);
    expect(data?.kpi.lost).toBe(1);
    expect(data?.kpi.interestRate).toBeCloseTo(2 / 7);
    expect(data?.kpi.closingRate).toBeCloseTo(1 / 7);
  });

  it("rate nol tanpa pembagian-nol saat outreach kosong", async () => {
    const { data } = await getCrmDashboard({
      mode: "custom",
      from: "2025-01-01",
      to: "2025-01-31",
    });

    expect(data?.kpi.outreach).toBe(0);
    expect(data?.kpi.interestRate).toBe(0);
    expect(data?.kpi.closingRate).toBe(0);
    expect(data?.perPic).toHaveLength(0);
  });

  it("tabel kinerja per PIC sesuai data", async () => {
    const { data } = await getCrmDashboard({
      mode: "custom",
      from: "2026-09-01",
      to: "2026-09-30",
    });
    const feby = data?.perPic.find((row) => row.picName === "Feby");

    // Feby: LEAD-001 (Follow Up), LEAD-004 (Contacted), LEAD-007 (Lost).
    expect(feby?.handled).toBe(3);
    expect(feby?.followUp).toBe(1);
    expect(feby?.contacted).toBe(1);
    expect(feby?.lost).toBe(1);
    expect(feby?.closing).toBe(0);
  });
});
