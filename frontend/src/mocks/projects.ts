import type { Project } from "@/types/project";

/**
 * Data mock proyek demo (US-019+). PRJ-001 ← HDV-003, PRJ-002 ← HDV-004.
 * Tanpa task/fitur terjadwal (progress 0%) — tambah lewat UI.
 */
export const mockProjects: Project[] = [
  {
    id: "PRJ-001",
    name: "Website Katalog Yayasan - Yayasan Maju Bersama (PYT-2026-003)",
    code: "PYT-2026-003",
    clientId: "KLI-002",
    pmName: "Raka",
    startDate: "2026-09-22",
    targetDate: "2026-12-15",
    value: 25000000,
    status: "Planning",
    handoverId: "HDV-003",
    createdAt: "2026-09-22T03:00:00Z",
    updatedAt: "2026-09-22T03:00:00Z",
  },
  {
    id: "PRJ-002",
    name: "Landing Page Properti - PT Sinar Abadi Properti (PYT-2026-004)",
    code: "PYT-2026-004",
    clientId: "KLI-001",
    pmName: "Dinda Prameswari",
    startDate: "2026-09-20",
    targetDate: "2027-01-31",
    value: 15000000,
    status: "Active",
    handoverId: "HDV-004",
    createdAt: "2026-09-20T03:00:00Z",
    updatedAt: "2026-09-20T03:00:00Z",
  },
];
