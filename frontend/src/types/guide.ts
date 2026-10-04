/**
 * Kontrak panduan SOP & matriks RACI (US-042).
 * Fase 1: mock; Fase 2: tabel `guides` + `raci_matrix`.
 */
export interface Guide {
  slug: string;
  title: string;
  /** Markdown sederhana (#, ##, -, **tebal**, [link](url)). */
  content: string;
  updatedAt: string;
}

/** Nilai RACI per sel (kosong = tidak terlibat). */
export type RaciValue = "R" | "A" | "C" | "I" | "";

export interface RaciRow {
  activity: string;
  assignments: Record<string, RaciValue>;
}

/** Kolom role matriks RACI (PRD US-042 + role portal). */
export const RACI_ROLES = [
  "Sales / Marketing",
  "Project Manager",
  "Developer",
  "Social Media Specialist",
  "Designer",
  "Leader",
  "Super Admin",
] as const;

export const RACI_VALUES: Exclude<RaciValue, "">[] = ["R", "A", "C", "I"];
