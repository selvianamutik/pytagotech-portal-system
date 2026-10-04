import { beforeEach, describe, expect, it } from "vitest";

import {
  listGuides,
  listRaci,
  resetMockGuides,
  setRaciCell,
  updateGuide,
} from "@/services/guides";

beforeEach(() => {
  resetMockGuides();
});

describe("guides", () => {
  it("seed 2 panduan + ubah isi", async () => {
    expect((await listGuides()).data).toHaveLength(2);

    const updated = await updateGuide("panduan-crm", "# Baru\n\nIsi baru.");
    expect(updated.error).toBeNull();
    expect(updated.data?.content).toMatch(/# Baru/);

    expect((await updateGuide("tak-ada", "x")).error).toBe("Panduan tidak ditemukan.");
    expect((await updateGuide("panduan-crm", "  ")).error).toMatch(/kosong/);
  });
});

describe("RACI", () => {
  it("matriks 3 aktivitas × 7 role + ubah sel", async () => {
    const { data } = await listRaci();

    expect(data).toHaveLength(3);
    expect(data?.[0]?.assignments["Sales / Marketing"]).toBe("R");

    const updated = await setRaciCell("Input & kelola lead", "Developer", "C");
    expect(updated.error).toBeNull();
    expect(updated.data?.assignments.Developer).toBe("C");

    expect((await setRaciCell("Input & kelola lead", "Alien", "R")).error).toMatch(
      /Role/
    );
    expect((await setRaciCell("Input & kelola lead", "Developer", "X")).error).toMatch(
      /R, A, C, I/
    );
    expect((await setRaciCell("Tak ada", "Developer", "R")).error).toMatch(/Aktivitas/);
  });
});
