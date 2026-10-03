import { beforeEach, describe, expect, it } from "vitest";

import {
  createClient,
  createClientFromLead,
  listClients,
  listConvertibleLeads,
  resetMockClients,
  updateClient,
} from "@/services/clients";
import { resetMockLeads } from "@/services/leads";

beforeEach(() => {
  resetMockLeads();
  resetMockClients();
});

describe("listClients", () => {
  it("mengembalikan 2 klien mock terurut nama", async () => {
    const result = await listClients();

    expect(result.error).toBeNull();
    expect(result.data?.map((client) => client.id)).toEqual(["KLI-001", "KLI-002"]);
  });
});

describe("createClient", () => {
  it("menyimpan klien valid dengan telepon ternormalisasi", async () => {
    const result = await createClient({
      companyName: "PT Baru Jaya",
      picName: "Bpk. Andi",
      phone: "0812-0000-2222",
      email: "andi@barujaya.id",
      referrer: "Website",
    });

    expect(result.error).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.data?.id).toMatch(/^KLI-\d+$/);
    expect(result.data?.phone).toBe("6281200002222");
  });

  it("menolak field wajib kosong dan format salah", async () => {
    expect(
      (await createClient({ companyName: " ", picName: "X", phone: "081200002222", email: "a@b.id", referrer: "R" })).error
    ).toMatch(/perusahaan/);
    expect(
      (await createClient({ companyName: "PT X", picName: "X", phone: "123", email: "a@b.id", referrer: "R" })).error
    ).toMatch(/WhatsApp/);
    expect(
      (await createClient({ companyName: "PT X", picName: "X", phone: "081200002222", email: "salah", referrer: "R" })).error
    ).toMatch(/email/);
    expect(
      (await createClient({ companyName: "PT X", picName: "X", phone: "081200002222", email: "a@b.id", referrer: " " })).error
    ).toMatch(/Referrer/);
  });

  it("memberi peringatan bila perusahaan sudah terdaftar", async () => {
    const result = await createClient({
      companyName: "pt sinar abadi properti",
      picName: "Bpk. Lain",
      phone: "081200003333",
      email: "lain@x.id",
      referrer: "Event",
    });

    expect(result.error).toBeNull();
    expect(result.warning).toMatch(/KLI-001/);
  });
});

describe("createClientFromLead", () => {
  it("mengisi otomatis dari lead Closing", async () => {
    const result = await createClientFromLead("LEAD-005", {
      picName: "Bpk. Hendra Baru",
      referrer: "Referral",
    });

    // LEAD-005 sudah menjadi KLI-001 di seed → ditolak duplikat konversi.
    expect(result.error).toMatch(/sudah dijadikan klien/);
  });

  it("menolak lead non-Closing dan konversi ganda", async () => {
    expect(
      (await createClientFromLead("LEAD-001", { picName: "X", referrer: "Y" })).error
    ).toMatch(/Closing/);
  });

  it("berhasil untuk lead Closing yang belum dikonversi", async () => {
    // Ubah LEAD-003 menjadi Closing lebih dulu via update status.
    const { updateLead } = await import("@/services/leads");
    await updateLead("LEAD-003", { status: "Closing" });
    const result = await createClientFromLead("LEAD-003", {
      picName: "Bpk. Toko",
      referrer: "Instagram",
    });

    expect(result.error).toBeNull();
    expect(result.data?.companyName).toBe("Toko Berkah Jaya");
    expect(result.data?.sourceLeadId).toBe("LEAD-003");

    // Konversi kedua ditolak.
    expect(
      (await createClientFromLead("LEAD-003", { picName: "X", referrer: "Y" })).error
    ).toMatch(/sudah dijadikan klien/);
  });
});

describe("listConvertibleLeads", () => {
  it("hanya berisi Closing yang belum menjadi klien", async () => {
    const result = await listConvertibleLeads();

    // LEAD-005 sudah menjadi KLI-001 → daftar kosong.
    expect(result.data).toHaveLength(0);
  });
});

describe("updateClient", () => {
  it("memperbarui data klien", async () => {
    const result = await updateClient("KLI-002", { picName: "Ibu Ratna Baru" });

    expect(result.error).toBeNull();
    expect(result.data?.picName).toBe("Ibu Ratna Baru");
  });
});
