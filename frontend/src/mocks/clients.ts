import type { Client } from "@/types/client";

/** Data mock klien (US-014). KLI-001 lahir dari LEAD-005 yang Closing. */
export const mockClients: Client[] = [
  {
    id: "KLI-001",
    companyName: "PT Sinar Abadi Properti",
    picName: "Bpk. Hendra Gunawan",
    phone: "6289988776655",
    email: "hendra@sinarabadi.co.id",
    referrer: "Referral",
    sourceLeadId: "LEAD-005",
    createdAt: "2026-10-02T07:00:00Z",
    updatedAt: "2026-10-02T07:00:00Z",
  },
  {
    id: "KLI-002",
    companyName: "Yayasan Maju Bersama",
    picName: "Ibu Ratna Sari",
    phone: "6282211002233",
    email: "ratna@majubersama.or.id",
    referrer: "Instagram",
    createdAt: "2026-09-15T03:00:00Z",
    updatedAt: "2026-09-15T03:00:00Z",
  },
];
