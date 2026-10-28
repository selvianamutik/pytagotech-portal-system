import { describe, expect, it } from "vitest";

import {
  createLead,
  findDuplicates,
  getLead,
  listLeadPICs,
  listLeads,
  updateLead,
} from "@/services/leads";
import type { CreateLeadInput } from "@/types/lead";

const validInput: CreateLeadInput = {
  contactDate: "2026-10-04",
  companyName: "PT Contoh Baru",
  industry: "Teknologi",
  whatsapp: "0812-0000-1111",
  instagram: "@contohbaru",
  email: "halo@contohbaru.id",
  picName: "Feby",
  status: "New",
};

describe("listLeads", () => {
  it("mengembalikan 8 lead mock terurut tanggal hubungi terbaru", async () => {
    const result = await listLeads();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(8);
  });

  it("getLead menolak id yang tidak dikenal", async () => {
    expect((await getLead("LEAD-999")).error).toBe("Lead tidak ditemukan.");
  });
});

describe("createLead", () => {
  it("menyimpan lead valid dengan nomor ternormalisasi", async () => {
    const result = await createLead(validInput);

    expect(result.error).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.data?.id).toMatch(/^LEAD-\d+$/);
    expect(result.data?.whatsapp).toBe("6281200001111");
  });

  it("menolak WhatsApp, email, dan Instagram yang salah format", async () => {
    expect(
      (await createLead({ ...validInput, whatsapp: "12345" })).error
    ).toMatch(/WhatsApp/);
    expect(
      (await createLead({ ...validInput, email: "bukan-email" })).error
    ).toMatch(/email/);
    expect(
      (await createLead({ ...validInput, instagram: "tanpa-at" })).error
    ).toMatch(/Instagram/);
  });

  it("menolak field wajib yang kosong dan opsi yang tidak dikenal", async () => {
    expect((await createLead({ ...validInput, companyName: "  " })).error).toMatch(
      /perusahaan/
    );
    expect(
      (await createLead({ ...validInput, industry: "Antariksa" })).error
    ).toMatch(/industri/);
    expect((await createLead({ ...validInput, picName: "Hantu" })).error).toMatch(
      /PIC/
    );
  });

  it("memberi peringatan duplikat via WhatsApp walau format beda", async () => {
    // LEAD-001 memakai 6281234567890.
    const result = await createLead({
      ...validInput,
      companyName: "PT Sama Sekali Beda",
      whatsapp: "+62 812-3456-7890",
    });

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.warning).toMatch(/LEAD-001/);
  });

  it("memberi peringatan duplikat via nama perusahaan", async () => {
    const result = await createLead({
      ...validInput,
      companyName: "pt aruna digital",
      whatsapp: "0819999999999",
    });

    expect(result.error).toBeNull();
    expect(result.warning).toMatch(/LEAD-001/);
  });
});

describe("findDuplicates", () => {
  it("mengenali duplikat lintas format nomor", async () => {
    expect(
      (await findDuplicates("081234567890", "PT Unik")).map((lead) => lead.id)
    ).toContain("LEAD-001");
    expect(await findDuplicates("0810000000000", "PT Unik")).toHaveLength(0);
  });
});

describe("updateLead", () => {
  it("mengubah status dan PIC", async () => {
    const result = await updateLead("LEAD-003", {
      status: "Contacted",
      picName: "Fira",
    });

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("Contacted");
    expect(result.data?.picName).toBe("Fira");
  });

  it("peringatan duplikat mengecualikan diri sendiri", async () => {
    const result = await updateLead("LEAD-001", {
      whatsapp: "0812 3456 7890",
    });

    // LEAD-008 berbagi nomor yang sama → tetap diperingatkan.
    expect(result.error).toBeNull();
    expect(result.warning).toMatch(/LEAD-008/);
  });

  it("menolak id dan status yang tidak dikenal", async () => {
    expect((await updateLead("LEAD-999", {})).error).toBe("Lead tidak ditemukan.");
    expect(
      (await updateLead("LEAD-001", { status: "Sultan" as never })).error
    ).toMatch(/Status/);
  });
});

describe("listLeadPICs", () => {
  it("hanya berisi user aktif", async () => {
    const result = await listLeadPICs();
    const names = (result.data ?? []).map((pic) => pic.name);

    expect(names).toContain("Feby");
    expect(names).not.toContain("Sinta (nonaktif)");
  });
});
