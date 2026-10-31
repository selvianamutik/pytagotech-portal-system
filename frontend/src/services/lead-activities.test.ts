import { describe, expect, it } from "vitest";

import {
  addLeadNote,
  getLeadTimeline,
  isFollowUpOverdue,
  listLeadNotes,
} from "@/services/lead-activities";
import { setNextFollowUp, updateLead } from "@/services/leads";

const actor = { id: "USR-002", name: "Feby" };

describe("addLeadNote", () => {
  it("menyimpan catatan dan menolak yang kosong", async () => {
    const result = await addLeadNote("LEAD-001", actor, "Telepon ulang besok pagi.");

    expect(result.error).toBeNull();
    const notes = await listLeadNotes("LEAD-001");
    expect(notes.data).toHaveLength(1);
    expect(notes.data?.[0]?.body).toBe("Telepon ulang besok pagi.");

    expect((await addLeadNote("LEAD-001", actor, "  ")).error).toBe(
      "Catatan tidak boleh kosong."
    );
  });

  it("menolak lead yang tidak dikenal", async () => {
    expect(
      (await addLeadNote("LEAD-999", actor, "Catatan")).error
    ).toBe("Lead tidak ditemukan.");
  });
});

describe("getLeadTimeline", () => {
  it("menggabungkan catatan dan perubahan status dengan waktu", async () => {
    await addLeadNote("LEAD-003", actor, "Sudah dihubungi via WhatsApp.");
    await updateLead("LEAD-003", { status: "Contacted" });

    const timeline = await getLeadTimeline("LEAD-003");

    expect(timeline.error).toBeNull();
    const status = timeline.data?.find((item) => item.kind === "status");
    expect(status?.title).toMatch(/New → Contacted/);
    expect(timeline.data?.some((item) => item.kind === "note")).toBe(true);
  });

  it("menampilkan perubahan tahap pipeline", async () => {
    const { moveInterestStage } = await import("@/services/interest");
    await moveInterestStage("LEAD-006", "Negotiation");

    const timeline = await getLeadTimeline("LEAD-006");
    const stage = timeline.data?.find((item) => item.kind === "stage");
    expect(stage?.title).toMatch(/Price Sent → Negotiation/);
  });

  it("terurut dari yang terbaru", async () => {
    await addLeadNote("LEAD-001", actor, "Catatan pertama.");
    await updateLead("LEAD-001", { nextFollowUp: "2026-10-20" });
    const timeline = await getLeadTimeline("LEAD-001");
    const times = (timeline.data ?? []).map((item) => item.createdAt);

    expect(timeline.data?.length).toBeGreaterThan(1);
    expect([...times].sort().reverse()).toEqual(times);
  });
});

describe("setNextFollowUp", () => {
  it("menjadwalkan follow-up dan mencatat timeline", async () => {
    const result = await setNextFollowUp("LEAD-003", "2026-10-08");

    expect(result.error).toBeNull();
    expect(result.data?.nextFollowUp).toBe("2026-10-08");

    const timeline = await getLeadTimeline("LEAD-003");
    expect(
      timeline.data?.some(
        (item) =>
          item.kind === "followup" && item.title.includes("2026-10-08")
      )
    ).toBe(true);
  });

  it("menolak tanggal tak valid dan lead tak dikenal", async () => {
    expect((await setNextFollowUp("LEAD-003", "kapan-kapan")).error).toMatch(
      /tidak valid/
    );
    expect((await setNextFollowUp("LEAD-999", "2026-10-08")).error).toMatch(
      /tidak ditemukan/
    );
  });
});

describe("isFollowUpOverdue", () => {
  it("overdue bila lewat hari ini dan status belum final", () => {
    expect(isFollowUpOverdue("2026-10-02", "Follow Up", "2026-10-04")).toBe(true);
    expect(isFollowUpOverdue("2026-10-10", "Follow Up", "2026-10-04")).toBe(false);
    expect(isFollowUpOverdue("2026-10-02", "Closing", "2026-10-04")).toBe(false);
    expect(isFollowUpOverdue(undefined, "Follow Up", "2026-10-04")).toBe(false);
  });
});
