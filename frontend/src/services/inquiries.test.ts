import { beforeEach, describe, expect, it } from "vitest";

import {
  convertInquiryToLead,
  isRoutingSlaMet,
  markInquiryRouted,
  recordInquiry,
  resetMockInquiries,
  routingMinutes,
} from "@/services/inquiries";
import { getLead, resetMockLeads } from "@/services/leads";

beforeEach(() => {
  resetMockInquiries();
  resetMockLeads();
});

describe("routingMinutes", () => {
  it("10 menit tercapai, 20 menit tidak (ambang 15)", () => {
    expect(
      routingMinutes({ receivedAt: "2026-10-04T01:00:00Z", routedAt: "2026-10-04T01:10:00Z" })
    ).toBe(10);
    expect(
      isRoutingSlaMet({ receivedAt: "2026-10-04T01:00:00Z", routedAt: "2026-10-04T01:10:00Z" })
    ).toBe(true);
    expect(
      isRoutingSlaMet({ receivedAt: "2026-10-04T01:00:00Z", routedAt: "2026-10-04T01:20:00Z" })
    ).toBe(false);
    expect(
      isRoutingSlaMet({ receivedAt: "2026-10-04T01:00:00Z", routedAt: null })
    ).toBe(false);
  });
});

describe("recordInquiry + markInquiryRouted", () => {
  it("mencatat dan menandai dialihkan", async () => {
    const created = await recordInquiry({
      platform: "Instagram",
      brand: "Pytafix",
      receivedAt: "2026-10-04T03:00:00Z",
      handler: "Alya",
    });

    expect(created.error).toBeNull();
    const routed = await markInquiryRouted(created.data!.id, "2026-10-04T03:05:00Z");
    expect(routed.data?.status).toBe("Dialihkan");
    expect(
      (await markInquiryRouted(created.data!.id, "2026-10-04T02:00:00Z")).error
    ).toMatch(/sebelum waktu masuk/);
  });
});

describe("convertInquiryToLead", () => {
  it("membuat lead dengan sumber tercatat + tautan balik", async () => {
    const result = await convertInquiryToLead("INQ-001", {
      companyName: "PT Tanya Digital",
      whatsapp: "081200004444",
      email: "halo@tanyadigital.id",
      picName: "Feby",
    });

    expect(result.error).toBeNull();
    const lead = await getLead(result.data!.leadId);
    expect(lead.data?.source).toBe("Sosmed/TikTok");

    expect(
      (
        await convertInquiryToLead("INQ-001", {
          companyName: "X",
          whatsapp: "081200005555",
          email: "x@y.id",
          picName: "Feby",
        })
      ).error
    ).toMatch(/sudah dijadikan lead/);
  });
});
