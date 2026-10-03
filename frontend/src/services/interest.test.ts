import { beforeEach, describe, expect, it } from "vitest";

import { listAudit, resetMockAudit } from "@/services/audit";
import {
  getPipeline,
  moveInterestStage,
  resetMockInterest,
  updateInterestNeed,
} from "@/services/interest";
import { resetMockLeads } from "@/services/leads";

const actor = { id: "USR-002", name: "Feby" };

beforeEach(() => {
  resetMockLeads();
  resetMockInterest();
  resetMockAudit();
});

describe("getPipeline", () => {
  it("hanya berisi lead berstatus Interest dengan tahap awal", async () => {
    const result = await getPipeline();
    const ids = (result.data ?? []).map((card) => card.lead.id);

    expect(ids.sort()).toEqual(["LEAD-002", "LEAD-006"]);
    expect(result.data?.find((card) => card.lead.id === "LEAD-002")?.stage).toBe("Demo");
    expect(result.data?.find((card) => card.lead.id === "LEAD-002")?.need).toMatch(
      /katalog/
    );
  });
});

describe("moveInterestStage", () => {
  it("memindahkan tahap dan mencatat audit", async () => {
    const result = await moveInterestStage("LEAD-006", "Negotiation", actor);

    expect(result.error).toBeNull();
    expect(result.data?.stage).toBe("Negotiation");

    const audit = await listAudit("LEAD-006");
    const move = (audit.data ?? []).find((entry) => entry.action === "lead.move-stage");
    expect(move?.oldValue).toBe("Price Sent");
    expect(move?.newValue).toBe("Negotiation");
  });

  it("menolak tahap asing dan lead non-Interest", async () => {
    expect(
      (await moveInterestStage("LEAD-002", "Sultan" as never, actor)).error
    ).toMatch(/Tahapan/);
    // LEAD-001 berstatus Follow Up.
    expect((await moveInterestStage("LEAD-001", "Demo", actor)).error).toMatch(
      /Interest/
    );
  });
});

describe("updateInterestNeed", () => {
  it("menyimpan kebutuhan klien", async () => {
    const result = await updateInterestNeed("LEAD-002", "Tambah fitur katalog PDF.");

    expect(result.error).toBeNull();
    expect(result.data?.need).toBe("Tambah fitur katalog PDF.");
  });
});
