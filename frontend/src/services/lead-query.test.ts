import { describe, expect, it } from "vitest";

import { queryLeads } from "@/services/leads";

describe("queryLeads", () => {
  it("paginasi default 5 per halaman", async () => {
    const first = await queryLeads({});
    expect(first.data?.items).toHaveLength(5);
    expect(first.data?.total).toBe(8);
    expect(first.data?.pageCount).toBe(2);

    const second = await queryLeads({ page: 2 });
    expect(second.data?.items).toHaveLength(3);
    expect(second.data?.page).toBe(2);
  });

  it("pencarian teks lintas perusahaan, email, WA, IG", async () => {
    expect((await queryLeads({ search: "aruna", limit: 20 })).data?.total).toBe(2);
    expect(
      (await queryLeads({ search: "mandalakreasi.com", limit: 20 })).data?.total
    ).toBe(1);
    expect(
      (await queryLeads({ search: "81122334455", limit: 20 })).data?.total
    ).toBe(1);
    expect((await queryLeads({ search: "tidak-ada-xyz", limit: 20 })).data?.total).toBe(0);
  });

  it("filter multi-kriteria dan rentang tanggal", async () => {
    const byStatus = await queryLeads({ statuses: ["New"], limit: 20 });
    expect(byStatus.data?.total).toBe(2);

    const byPic = await queryLeads({ picNames: ["Feby"], limit: 20 });
    expect(byPic.data?.total).toBe(3);

    const byIndustry = await queryLeads({ industries: ["Teknologi"], limit: 20 });
    expect(byIndustry.data?.total).toBe(2);

    const byDate = await queryLeads({
      dateFrom: "2026-09-20",
      dateTo: "2026-09-25",
      limit: 20,
    });
    expect(byDate.data?.total).toBe(3);

    const combined = await queryLeads({
      statuses: ["New", "Follow Up"],
      picNames: ["Feby", "Fira"],
      limit: 20,
    });
    expect(combined.data?.total).toBe(2);
  });

  it("sort per kolom dua arah", async () => {
    const asc = await queryLeads({ sortBy: "companyName", sortDir: "asc", limit: 20 });
    const names = (asc.data?.items ?? []).map((lead) => lead.companyName);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);

    const desc = await queryLeads({ sortBy: "contactDate", sortDir: "desc", limit: 20 });
    const dates = (desc.data?.items ?? []).map((lead) => lead.contactDate);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("halaman di luar jangkauan dijepit ke halaman terakhir", async () => {
    const result = await queryLeads({ page: 99 });
    expect(result.data?.page).toBe(result.data?.pageCount);
  });
});
