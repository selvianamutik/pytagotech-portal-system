import { beforeEach, describe, expect, it } from "vitest";

import { resetMockClients } from "@/services/clients";
import {
  createDeal,
  getDeal,
  listDeals,
  resetMockDeals,
  updateDeal,
} from "@/services/deals";
import { formatDealName } from "@/types/deal";
import type { CreateDealInput } from "@/types/deal";

const validInput: CreateDealInput = {
  title: "Aplikasi Kasir",
  code: "PYT-2026-010",
  clientId: "KLI-001",
  scope: "Aplikasi kasir + stok.",
  features: [{ name: "Kasir", description: "Transaksi + struk." }],
  objective: "Go-live 2 bulan.",
  value: 25000000,
  termScheme: "50-50",
  deadline: "2026-12-31",
  notes: "",
};

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
});

describe("formatDealName", () => {
  it("mengikuti pola [Judul] - [Klien] ([Kode])", () => {
    expect(formatDealName("Website", "PT X", "PYT-1")).toBe("Website - PT X (PYT-1)");
  });
});

describe("listDeals", () => {
  it("mengembalikan display name terformat + nama klien", async () => {
    const result = await listDeals();

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.displayName).toBe(
      "Website Company Profile - PT Sinar Abadi Properti (PYT-2026-001)"
    );
  });

  it("getDeal menolak id tak dikenal", async () => {
    expect((await getDeal("HDV-999")).error).toBe("Deal handover tidak ditemukan.");
  });
});

describe("createDeal", () => {
  it("menyimpan handover berstatus Draft + versi awal", async () => {
    const result = await createDeal(validInput);

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^HDV-\d+$/);
    expect(result.data?.status).toBe("Draft");
    expect(result.data?.versions).toHaveLength(1);
  });

  it("menolak kode ganda dan field wajib kosong", async () => {
    expect(
      (await createDeal({ ...validInput, code: "PYT-2026-001" })).error
    ).toMatch(/sudah dipakai/);
    expect((await createDeal({ ...validInput, title: "  " })).error).toMatch(/Judul/);
    expect((await createDeal({ ...validInput, features: [] })).error).toMatch(
      /Minimal satu fitur/
    );
    expect(
      (await createDeal({ ...validInput, features: [{ name: "X", description: " " }] })).error
    ).toMatch(/penjelasan/);
    expect((await createDeal({ ...validInput, value: 0 })).error).toMatch(/Nilai deal/);
    expect((await createDeal({ ...validInput, clientId: "KLI-999" })).error).toMatch(
      /Klien/
    );
  });
});

describe("updateDeal", () => {
  it("mengubah draft dan menolak kode ganda", async () => {
    expect((await updateDeal("HDV-002", { value: 35000000 })).data?.value).toBe(35000000);
    expect((await updateDeal("HDV-002", { code: "PYT-2026-001" })).error).toMatch(
      /sudah dipakai/
    );
  });
});
