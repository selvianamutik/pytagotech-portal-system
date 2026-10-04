/**
 * Kontrak master data developer (permintaan pemilik, FR-3 kandidat US-005).
 * Dipakai dropdown penanggung jawab task/fitur. Status internal/external
 * membedakan karyawan tetap, magang, dan freelance.
 * Fase 1: mock; Fase 2: tabel master (US-005).
 */
export const EMPLOYMENT_STATUSES = ["internal", "external"] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export interface Developer {
  id: string;
  name: string;
  status: EmploymentStatus;
  createdAt: string;
}

export interface DeveloperInput {
  name: string;
  status: string;
}

export function isEmploymentStatus(value: string): value is EmploymentStatus {
  return (EMPLOYMENT_STATUSES as readonly string[]).includes(value);
}
