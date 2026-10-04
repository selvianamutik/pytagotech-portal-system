import type { ProjectFeature } from "@/types/feature";

/** Data mock fitur demo terjadwal (untuk kalender & Gantt). */
export const mockFeatures: ProjectFeature[] = [
  {
    id: "FIT-001",
    projectId: "PRJ-001",
    name: "Katalog program",
    category: "Handover",
    priority: "Medium",
    developer: "Nabila",
    estimateDays: 5,
    source: "handover",
    scheduledStart: "2026-10-06",
    scheduledEnd: "2026-10-10",
    createdAt: "2026-09-22T03:00:00Z",
  },
  {
    id: "FIT-002",
    projectId: "PRJ-001",
    name: "Galeri kegiatan",
    category: "Handover",
    priority: "Low",
    developer: "Raka",
    estimateDays: 3,
    source: "handover",
    scheduledStart: "2026-10-13",
    scheduledEnd: "2026-10-15",
    createdAt: "2026-09-22T03:00:00Z",
  },
  {
    id: "FIT-003",
    projectId: "PRJ-002",
    name: "Form survei",
    category: "Kontak",
    priority: "High",
    developer: "Dimas (Freelance)",
    estimateDays: 2,
    source: "manual",
    scheduledStart: "2026-10-05",
    scheduledEnd: "2026-10-06",
    createdAt: "2026-09-20T03:00:00Z",
  },
];
