import { beforeEach, describe, expect, it } from "vitest";

import { resetMockClients } from "@/services/clients";
import {
  listTerms,
  replaceTerms,
  resetMockTerms,
  updateTermStatus,
} from "@/services/deal-terms";
import { resetMockDeals } from "@/services/deals";

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
});

describe("listTerms", () => {
  it("menghitung total dan status seimbang HDV-001", async () => {
    const result = await listTerms("HDV-001");

    expect(result.error).toBeNull();
    expect(result.data?.terms).toHaveLength(3);
    expect(result.data?.totalAmount).toBe(45000000);
    expect(result.data?.balanced).toBe(true);
  });

  it("menandai HDV-002 belum seimbang (baru 50%)", async () => {
    const result = await listTerms("HDV-002");

    expect(result.data?.balanced).toBe(false);
    expect(result.data?.totalAmount).toBe(15000000);
  });

  it("menolak deal tak dikenal", async () => {
    expect((await listTerms("HDV-999")).error).toBe("Deal handover tidak ditemukan.");
  });
});

describe("replaceTerms", () => {
  it("menyimpan set seimbang dan mempertahankan status lama", async () => {
    const result = await replaceTerms("HDV-002", [
      { id: "TRM-004", name: "DP 50%", kind: "percent", value: 50, milestone: "DP" },
      { name: "Pelunasan", kind: "amount", value: 15000000, dueDate: "2026-11-30" },
    ]);

    expect(result.error).toBeNull();
    expect(result.data?.balanced).toBe(true);
    expect(
      result.data?.terms.find((term) => term.id === "TRM-004")?.status
    ).toBe("Belum Ditagih");
  });

  it("menolak total yang tidak sama dengan pesan selisih", async () => {
    const result = await replaceTerms("HDV-002", [
      { name: "DP", kind: "percent", value: 60, milestone: "DP" },
    ]);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/tidak sama dengan nilai deal/);
    expect(result.error).toMatch(/kurang/);
  });

  it("menolak baris tak valid: nama, persen >100, tanpa tempo", async () => {
    expect(
      (
        await replaceTerms("HDV-002", [
          { name: " ", kind: "percent", value: 100, milestone: "X" },
        ])
      ).error
    ).toMatch(/Nama termin/);
    expect(
      (
        await replaceTerms("HDV-002", [
          { name: "X", kind: "percent", value: 120, milestone: "X" },
        ])
      ).error
    ).toMatch(/maksimal 100%/);
    expect(
      (await replaceTerms("HDV-002", [{ name: "X", kind: "percent", value: 100 }])).error
    ).toMatch(/tanggal atau milestone/);
  });
});

describe("updateTermStatus", () => {
  it("mengubah status termin", async () => {
    const result = await updateTermStatus("TRM-003", "Ditagih");

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("Ditagih");
    expect((await updateTermStatus("TRM-999", "Lunas")).error).toBe(
      "Termin tidak ditemukan."
    );
  });
});
