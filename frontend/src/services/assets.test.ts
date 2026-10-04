import { beforeEach, describe, expect, it } from "vitest";

import {
  canLinkAsset,
  createAsset,
  isAssetExpired,
  linkAssetsToMaterial,
  listAssetsWithStatus,
  resetMockAssets,
} from "@/services/assets";
import { resetMockMaterials } from "@/services/materials";

beforeEach(() => {
  resetMockAssets();
  resetMockMaterials();
});

describe("expiry", () => {
  it("kedaluwarsa, peringatan 30 hari, tanpa batas", async () => {
    const { data } = await listAssetsWithStatus("2026-10-04");
    const byId = new Map((data ?? []).map((asset) => [asset.id, asset]));

    // AST-002 kedaluwarsa 2026-10-20 → 16 hari → expiring soon.
    expect(byId.get("AST-002")?.expired).toBe(false);
    expect(byId.get("AST-002")?.expiringSoon).toBe(true);
    // AST-003 sudah lewat.
    expect(byId.get("AST-003")?.expired).toBe(true);
    // AST-001 tanpa batas.
    expect(byId.get("AST-001")?.expired).toBe(false);
    expect(byId.get("AST-001")?.daysLeft).toBeNull();

    expect(isAssetExpired(byId.get("AST-003")!, "2026-10-04")).toBe(true);
    expect(canLinkAsset(byId.get("AST-003")!, "2026-10-04")).toBe(false);
  });
});

describe("CRUD", () => {
  it("tambah dengan validasi", async () => {
    const result = await createAsset({
      name: "Font pack",
      fileType: "OTF",
      cloudLink: "",
      owner: "internal",
      licenseType: "OFL",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^AST-/);
    expect(
      (
        await createAsset({
          name: "X", fileType: "Y", cloudLink: "", owner: "alien", licenseType: "Z",
        })
      ).error
    ).toMatch(/Pemilik/);
  });
});

describe("linkAssetsToMaterial", () => {
  it("menautkan yang valid, menolak kedaluwarsa", async () => {
    const ok = await linkAssetsToMaterial("MAT-0018", ["AST-001", "AST-002"], "2026-10-04");

    expect(ok.error).toBeNull();
    expect(ok.data).toEqual(["AST-001", "AST-002"]);

    const rejected = await linkAssetsToMaterial("MAT-0018", ["AST-003"], "2026-10-04");
    expect(rejected.error).toMatch(/kedaluwarsa/);
  });
});
