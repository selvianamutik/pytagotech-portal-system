import type { ChangeRequest } from "@/types/deal";

/** Data mock change request (US-018). */
export const mockChangeRequests: ChangeRequest[] = [
  {
    id: "CR-001",
    dealId: "HDV-002",
    kind: "negosiasi",
    description: "Klien meminta skema termin 30-40-30.",
    valueImpact: null,
    deadlineImpact: null,
    status: "Diajukan",
    createdById: "USR-007",
    createdByName: "Figo",
    createdAt: "2026-10-02T03:00:00Z",
    decidedAt: null,
  },
];
