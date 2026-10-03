import type { PaymentTerm } from "@/types/deal";

/** Data mock termin (US-016). TRM HDV-001 genap 100% = Rp45jt. */
export const mockTerms: PaymentTerm[] = [
  {
    id: "TRM-001",
    dealId: "HDV-001",
    name: "DP 50%",
    kind: "percent",
    value: 50,
    milestone: "Penandatanganan kesepakatan",
    status: "Lunas",
  },
  {
    id: "TRM-002",
    dealId: "HDV-001",
    name: "Serah terima desain 30%",
    kind: "percent",
    value: 30,
    milestone: "Approval desain",
    status: "Ditagih",
  },
  {
    id: "TRM-003",
    dealId: "HDV-001",
    name: "Pelunasan 20%",
    kind: "percent",
    value: 20,
    dueDate: "2026-12-20",
    status: "Belum Ditagih",
  },
  {
    id: "TRM-004",
    dealId: "HDV-002",
    name: "DP 50%",
    kind: "percent",
    value: 50,
    status: "Belum Ditagih",
  },
];
