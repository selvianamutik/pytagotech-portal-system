import { describe, expect, it } from "vitest";

import { getLeadTimeline } from "@/services/lead-activities";
import { assignLeadPIC, getLead } from "@/services/leads";

describe("assignLeadPIC", () => {
  it("menetapkan PIC ke banyak lead sekaligus", async () => {
    const result = await assignLeadPIC(["LEAD-001", "LEAD-003"], "Fira");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect((await getLead("LEAD-001")).data?.picName).toBe("Fira");
    expect((await getLead("LEAD-003")).data?.picName).toBe("Fira");
  });

  it("mencatat perubahan PIC di timeline lead", async () => {
    await assignLeadPIC(["LEAD-001", "LEAD-004"], "Fira");

    const first = await getLeadTimeline("LEAD-001");
    const picChanges = (first.data ?? []).filter((item) => item.kind === "assign");
    expect(picChanges).toHaveLength(1);
    expect(picChanges[0]?.title).toContain("Fira");
    expect(picChanges[0]?.detail).toContain("Feby");

    expect(
      (await getLeadTimeline("LEAD-004")).data?.some(
        (item) => item.kind === "assign"
      )
    ).toBe(true);
  });

  it("tidak mencatat perubahan bila PIC tidak berubah", async () => {
    await assignLeadPIC(["LEAD-001"], "Feby");

    const timeline = await getLeadTimeline("LEAD-001");
    expect(timeline.data?.some((item) => item.kind === "assign")).toBe(false);
  });

  it("menolak PIC asing, daftar kosong, dan id tak dikenal", async () => {
    expect((await assignLeadPIC(["LEAD-001"], "Hantu")).error).toMatch(/PIC/);
    expect((await assignLeadPIC([], "Feby")).error).toMatch(/minimal satu/);
    expect((await assignLeadPIC(["LEAD-999"], "Feby")).error).toMatch(
      /LEAD-999/
    );
  });
});
