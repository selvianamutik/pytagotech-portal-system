import { beforeEach, describe, expect, it } from "vitest";

import {
  createChangeRequest,
  decideChangeRequest,
  listChangeRequests,
  resetMockChangeRequests,
} from "@/services/change-requests";
import { resetMockClients } from "@/services/clients";
import { getDeal, resetMockDeals } from "@/services/deals";

const author = { id: "USR-007", name: "Figo" };
const decider = { id: "USR-003", name: "Raka" };

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockChangeRequests();
});

describe("createChangeRequest", () => {
  it("mencatat CR berstatus Diajukan", async () => {
    const result = await createChangeRequest(
      "HDV-001",
      {
        kind: "penyesuaian harga",
        description: "Tambah modul laporan, nilai naik Rp5jt.",
        valueImpact: 50000000,
      },
      author
    );

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("Diajukan");
    expect((await listChangeRequests("HDV-001")).data).toHaveLength(1);
  });

  it("menolak jenis asing, deskripsi kosong, dan tanpa dampak", async () => {
    expect(
      (
        await createChangeRequest(
          "HDV-001",
          { kind: "sihir", description: "X", valueImpact: 1000 },
          author
        )
      ).error
    ).toMatch(/Jenis/);
    expect(
      (
        await createChangeRequest(
          "HDV-001",
          { kind: "negosiasi", description: "  ", valueImpact: 1000 },
          author
        )
      ).error
    ).toMatch(/Deskripsi/);
    expect(
      (await createChangeRequest("HDV-001", { kind: "negosiasi", description: "X" }, author))
        .error
    ).toMatch(/minimal satu dampak/);
  });
});

describe("decideChangeRequest", () => {
  it("persetujuan memperbarui deal + riwayat versi", async () => {
    const created = await createChangeRequest(
      "HDV-002",
      {
        kind: "penyesuaian harga",
        description: "Naik menjadi Rp35jt.",
        valueImpact: 35000000,
        deadlineImpact: "2026-12-15",
      },
      author
    );

    const decided = await decideChangeRequest({
      crId: created.data!.id,
      decision: "Disetujui",
      actor: decider,
    });

    expect(decided.error).toBeNull();
    expect(decided.data?.status).toBe("Disetujui");

    const deal = await getDeal("HDV-002");
    expect(deal.data?.deal.value).toBe(35000000);
    expect(deal.data?.deal.deadline).toBe("2026-12-15");
    expect(deal.data?.deal.versions).toHaveLength(2);
    expect(deal.data?.deal.versions[1]?.note).toMatch(/CR-/);
  });

  it("penolakan tidak mengubah deal; putusan ganda ditolak", async () => {
    const decided = await decideChangeRequest({
      crId: "CR-001",
      decision: "Ditolak",
      actor: decider,
    });

    expect(decided.error).toBeNull();
    const deal = await getDeal("HDV-002");
    expect(deal.data?.deal.versions).toHaveLength(1);

    expect(
      (await decideChangeRequest({ crId: "CR-001", decision: "Disetujui", actor: decider })).error
    ).toMatch(/sudah Ditolak/);
  });
});
