import { beforeEach, describe, expect, it } from "vitest";

import { listAudit, resetMockAudit } from "@/services/audit";
import {
  addLeadNote,
  getLeadTimeline,
  isFollowUpOverdue,
  listLeadNotes,
  resetMockLeadActivities,
} from "@/services/lead-activities";
import { setNextFollowUp, updateLead } from "@/services/leads";

const actor = { id: "USR-002", name: "Feby" };

beforeEach(() => {
  resetMockLeadActivities();
  resetMockAudit();
});

describe("addLeadNote", () => {
  it("menyimpan catatan dan menolak yang kosong", async () => {
    const result = await addLeadNote("LEAD-001", "USR-002", "Telepon ulang besok pagi.");

    expect(result.error).toBeNull();
    expect((await listLeadNotes("LEAD-001")).data).toHaveLength(2);

    expect((await addLeadNote("LEAD-001", "USR-002", "  ")).error).toBe(
      "Catatan tidak boleh kosong."
    );
  });
});

describe("getLeadTimeline", () => {
  it("menggabungkan catatan dan perubahan dengan penulis dan waktu", async () => {
    await updateLead("LEAD-003", { status: "Contacted" }, actor);

    const timeline = await getLeadTimeline("LEAD-003");

    expect(timeline.error).toBeNull();
    expect(timeline.data).toHaveLength(1);
    expect(timeline.data?.[0]?.kind).toBe("status");
    expect(timeline.data?.[0]?.title).toMatch(/New → Contacted/);
    expect(timeline.data?.[0]?.actorName).toBe("Feby");
  });

  it("terurut dari yang terbaru", async () => {
    await addLeadNote("LEAD-001", "USR-002", "Catatan terbaru.");
    const timeline = await getLeadTimeline("LEAD-001");
    const times = (timeline.data ?? []).map((item) => item.createdAt);

    expect(timeline.data?.length).toBeGreaterThan(1);
    expect([...times].sort().reverse()).toEqual(times);
  });
});

describe("setNextFollowUp", () => {
  it("menjadwalkan follow-up dan mencatat audit", async () => {
    const result = await setNextFollowUp("LEAD-003", "2026-10-08", actor);

    expect(result.error).toBeNull();
    expect(result.data?.nextFollowUp).toBe("2026-10-08");

    const audit = await listAudit("LEAD-003");
    expect(
      (audit.data ?? []).some((entry) => entry.action === "lead.followup")
    ).toBe(true);
  });

  it("menolak tanggal tak valid dan lead tak dikenal", async () => {
    expect((await setNextFollowUp("LEAD-003", "kapan-kapan", actor)).error).toMatch(
      /tidak valid/
    );
    expect((await setNextFollowUp("LEAD-999", "2026-10-08", actor)).error).toMatch(
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
