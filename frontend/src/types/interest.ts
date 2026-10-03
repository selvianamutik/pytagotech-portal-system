import type { Lead } from "@/types/lead";

/**
 * Kontrak pipeline Interested Leads (US-011, FR-8).
 * Lead berstatus Interest otomatis masuk pipeline.
 * Fase 1: state tahap + kebutuhan di mock; Fase 2: tabel `lead_interests`.
 */

/** 7 tahapan pipeline sesuai PRD US-011. */
export const INTEREST_STAGES = [
  "New Interest",
  "Contacted",
  "Demo",
  "Price Sent",
  "Negotiation",
  "Closing",
  "Lost",
] as const;

export type InterestStage = (typeof INTEREST_STAGES)[number];

export interface InterestState {
  leadId: string;
  stage: InterestStage;
  /** Kebutuhan / solusi yang dicari klien. */
  need: string;
  updatedAt: string;
}

/** Kartu pipeline: snapshot lead + state tahapnya. */
export interface PipelineCard {
  lead: Lead;
  stage: InterestStage;
  need: string;
  updatedAt: string;
}

export function isInterestStage(value: string): value is InterestStage {
  return (INTEREST_STAGES as readonly string[]).includes(value);
}
