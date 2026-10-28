import { describe, expect, it } from "vitest";

import {
  importLeads,
  LEAD_CSV_TEMPLATE,
  parseLeadCsv,
  previewLeadImport,
} from "@/services/lead-import";

describe("parseLeadCsv", () => {
  it("memisahkan kolom dan menangani koma dalam kutip", () => {
    const rows = parseLeadCsv('a,"b, c",d\n"e""f",g');

    expect(rows).toEqual([
      ["a", "b, c", "d"],
      ['e"f', "g"],
    ]);
  });

  it("mengabaikan baris kosong", () => {
    expect(parseLeadCsv("a,b\n\n")).toEqual([["a", "b"]]);
  });
});

describe("previewLeadImport", () => {
  it("template bawaan valid penuh", async () => {
    const result = await previewLeadImport(LEAD_CSV_TEMPLATE);

    expect(result.error).toBeNull();
    expect(result.data?.validCount).toBe(1);
    expect(result.data?.invalidCount).toBe(0);
  });

  it("menolak header yang tidak sesuai template", async () => {
    const result = await previewLeadImport("nama,email\nPT X,x@y.id");

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Header tidak sesuai/);
  });

  it("menandai baris tidak valid dan duplikat", async () => {
    const csv = [
      "companyName,industry,contactDate,whatsapp,instagram,email,picName,status",
      "PT Bagus,Teknologi,2026-10-04,081200001111,@bagus,bagus@x.id,Feby,New",
      "PT Jelek,Teknologi,2026-10-04,12345,@jelek,jelek@x.id,Feby,New",
      "PT Aruna Digital,Teknologi,2026-10-04,081299998888,@aruna,baru@x.id,Feby,New",
      "PT Bagus,Teknologi,2026-10-04,081200001112,@bagus2,bagus2@x.id,Feby,New",
    ].join("\n");
    const result = await previewLeadImport(csv);

    expect(result.error).toBeNull();
    expect(result.data?.rows).toHaveLength(4);
    expect(result.data?.validCount).toBe(1);
    expect(result.data?.invalidCount).toBe(1);
    // Baris 3 duplikat nama (LEAD-001), baris 4 duplikat nama dalam file.
    expect(result.data?.duplicateCount).toBe(2);
  });
});

describe("importLeads", () => {
  it("menyimpan yang valid dan melewati duplikat", async () => {
    const csv = [
      "companyName,industry,contactDate,whatsapp,instagram,email,picName,status",
      "PT Impor Satu,Jasa,2026-10-04,081200002222,@satu,satu@x.id,Feby,New",
      "PT Aruna Digital,Teknologi,2026-10-04,081299998888,@aruna,baru@x.id,Feby,New",
    ].join("\n");
    const preview = await previewLeadImport(csv);

    const result = await importLeads(preview.data!, { skipDuplicates: true });

    expect(result.data).toEqual({ created: 1, skippedDuplicates: 1, skippedInvalid: 0 });
  });
});
