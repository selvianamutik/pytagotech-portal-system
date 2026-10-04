import type { SosmedBrand, SosmedPlatform } from "@/types/sosmed";

/**
 * Kontrak ide Content Planner (US-027, FR-21).
 * Skor = field brief terisi ÷ 5. Ambang "Siap Masuk Produksi" = 5/5
 * (jawaban Q-003 opsi A). Fase 1: mock; Fase 2: tabel `content_ideas`.
 */

/** Status kelayakan ide sesuai PRD US-027. */
export const IDEA_READINESS = [
  "Siap Masuk Produksi",
  "Tahan - Perlu Verifikasi",
  "Disetujui",
  "Ditunda",
] as const;

export type IdeaReadiness = (typeof IDEA_READINESS)[number];

export const IDEA_FUNNELS = ["Awareness", "Consideration", "Conversion"] as const;

export type IdeaFunnel = (typeof IDEA_FUNNELS)[number];

export interface ContentBrief {
  hook: string;
  angle: string;
  keyPoints: string;
  cta: string;
  assetRef: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  brand: SosmedBrand;
  /** Pillar konten (teks bebas; kandidat master data US-005). */
  pillar: string;
  funnel: IdeaFunnel;
  targetPlatforms: SosmedPlatform[];
  brief: ContentBrief;
  readiness: IdeaReadiness;
  createdAt: string;
}

export interface IdeaInput {
  title: string;
  brand: string;
  pillar: string;
  funnel: string;
  targetPlatforms: SosmedPlatform[];
  brief: ContentBrief;
  readiness: string;
}

/** Jumlah field brief terisi (0–5). */
export function briefScore(brief: ContentBrief): number {
  return [brief.hook, brief.angle, brief.keyPoints, brief.cta, brief.assetRef].filter(
    (field) => field.trim().length > 0
  ).length;
}

export function isIdeaReadiness(value: string): value is IdeaReadiness {
  return (IDEA_READINESS as readonly string[]).includes(value);
}

export function isIdeaFunnel(value: string): value is IdeaFunnel {
  return (IDEA_FUNNELS as readonly string[]).includes(value);
}
