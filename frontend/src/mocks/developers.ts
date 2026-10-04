import type { Developer } from "@/types/developer";

/** Data mock developer: internal (tetap + magang) dan external (freelance). */
export const mockDevelopers: Developer[] = [
  {
    id: "DEV-001",
    name: "Nabila",
    status: "internal",
    createdAt: "2026-09-01T02:00:00Z",
  },
  {
    id: "DEV-002",
    name: "Raka",
    status: "internal",
    createdAt: "2026-09-01T02:00:00Z",
  },
  {
    id: "DEV-003",
    name: "Dimas (Freelance)",
    status: "external",
    createdAt: "2026-09-15T02:00:00Z",
  },
  {
    id: "DEV-004",
    name: "Ayu (Magang)",
    status: "internal",
    createdAt: "2026-10-01T02:00:00Z",
  },
];
