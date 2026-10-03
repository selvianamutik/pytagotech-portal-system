import type { PortalUser } from "@/types/auth";

/**
 * Data mock user untuk Fase 1 (US-002).
 * TIDAK ada password yang disimpan di sini: `services/auth.login`
 * hanya memvalidasi format dan keberadaan email; verifikasi kredensial
 * asli dilakukan Supabase Auth di Fase 2.
 */
export const mockUsers: PortalUser[] = [
  {
    id: "USR-001",
    name: "Dinda Prameswari",
    email: "dinda@pytagotech.test",
    roles: ["Super Admin", "Executive / Leader"],
    isActive: true,
    createdAt: "2026-09-01T02:00:00Z",
  },
  {
    id: "USR-002",
    name: "Feby",
    email: "feby@pytagotech.test",
    roles: ["Sales / Marketing"],
    isActive: true,
    createdAt: "2026-09-02T02:00:00Z",
  },
  {
    id: "USR-003",
    name: "Raka",
    email: "raka@pytagotech.test",
    roles: ["Project Manager"],
    isActive: true,
    createdAt: "2026-09-03T02:00:00Z",
  },
  {
    id: "USR-004",
    name: "Nabila",
    email: "nabila@pytagotech.test",
    roles: ["Developer", "Graphic Designer / Video Editor / Copywriter"],
    isActive: true,
    createdAt: "2026-09-04T02:00:00Z",
  },
  {
    id: "USR-005",
    name: "Sinta (nonaktif)",
    email: "sinta@pytagotech.test",
    roles: ["Sales / Marketing"],
    isActive: false,
    createdAt: "2026-09-05T02:00:00Z",
  },
  {
    id: "USR-006",
    name: "Fira",
    email: "fira@pytagotech.test",
    roles: ["Sales / Marketing"],
    isActive: true,
    createdAt: "2026-09-06T02:00:00Z",
  },
  {
    id: "USR-007",
    name: "Figo",
    email: "figo@pytagotech.test",
    roles: ["Sales / Marketing"],
    isActive: true,
    createdAt: "2026-09-07T02:00:00Z",
  },
];
