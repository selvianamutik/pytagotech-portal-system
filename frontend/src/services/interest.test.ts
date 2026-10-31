import { describe, expect, it } from "vitest";

import { getLeadTimeline } from "@/services/lead-activities";
import {
  getPipeline,
  moveInterestStage,
  updateInterestNeed,
} from "@/services/interest";

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
  it("memindahkan tahap dan mencatat timeline", async () => {
    const result = await moveInterestStage("LEAD-006", "Negotiation");

    expect(result.error).toBeNull();
    expect(result.data?.stage).toBe("Negotiation");

    const timeline = await getLeadTimeline("LEAD-006");
    const move = timeline.data?.find((item) => item.kind === "stage");
    expect(move?.title).toMatch(/Price Sent → Negotiation/);
  });

  it("menolak tahap asing dan lead non-Interest", async () => {
    expect(
      (await moveInterestStage("LEAD-002", "Sultan" as never)).error
    ).toMatch(/Tahapan/);
    // LEAD-001 berstatus Follow Up.
    expect((await moveInterestStage("LEAD-001", "Demo")).error).toMatch(
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
