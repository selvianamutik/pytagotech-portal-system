import { beforeEach, describe, expect, it } from "vitest";

import { resetMockMaterials } from "@/services/materials";
import {
  releaseMaterial,
  scheduleMaterial,
  setGateItem,
} from "@/services/quality-gate";
import { getMaterial } from "@/services/materials";

const admin = { name: "Dinda", roles: ["Super Admin"] };
const specialist = { name: "Alya", roles: ["Social Media Specialist"] };

async function approveMat0018() {
  const { getMaterial: get, saveMaterial } = await import("@/services/materials");
  const mat = (await get("MAT-0018")).data!;
  mat.status = "Disetujui";
  await saveMaterial(mat);
}

beforeEach(() => {
  resetMockMaterials();
});

describe("setGateItem", () => {
  it("mencentang item dan menolak item asing", async () => {
    expect((await setGateItem("MAT-0018", "brand cover", true)).error).toBeNull();
    expect((await getMaterial("MAT-0018")).data?.qualityGate["brand cover"]).toBe(true);
    expect(
      (await setGateItem("MAT-0018", "kecantikan" as never, true)).error
    ).toMatch(/tidak dikenal/);
  });
});

describe("scheduleMaterial", () => {
  it("menolak bila belum Disetujui atau gate belum lengkap", async () => {
    // MAT-0018 masih Draf.
    expect(
      (await scheduleMaterial("MAT-0018", { scheduleDate: "2026-10-10" }, specialist)).error
    ).toMatch(/Disetujui/);

    await approveMat0018();
    // Gate MAT-0018 belum lengkap (3 kosong).
    expect(
      (await scheduleMaterial("MAT-0018", { scheduleDate: "2026-10-10" }, specialist)).error
    ).toMatch(/belum lengkap/);
  });

  it("lolos dengan gate penuh; Admin bisa override beralasan", async () => {
    await approveMat0018();
    for (const item of ["brand cover", "link bio/CTA", "proofread copy"] as const) {
      await setGateItem("MAT-0018", item, true);
    }
    expect(
      (await scheduleMaterial("MAT-0018", { scheduleDate: "2026-10-10", releaseTime: "17:00" }, specialist)).error
    ).toBeNull();
    expect((await getMaterial("MAT-0018")).data?.status).toBe("Dijadwalkan");
  });

  it("override Admin wajib beralasan", async () => {
    await approveMat0018();
    expect(
      (await scheduleMaterial("MAT-0018", { scheduleDate: "2026-10-10" }, admin)).error
    ).toMatch(/alasan/);
    const ok = await scheduleMaterial(
      "MAT-0018",
      { scheduleDate: "2026-10-10", overrideReason: "Klien mendesak." },
      admin
    );
    expect(ok.error).toBeNull();
    expect((await getMaterial("MAT-0018")).data?.gateOverride?.by).toBe("Dinda");
  });
});

describe("releaseMaterial", () => {
  it("hanya dari Dijadwalkan dengan gate penuh", async () => {
    expect((await releaseMaterial("MAT-0018", admin)).error).toMatch(/Dijadwalkan/);
  });
});
