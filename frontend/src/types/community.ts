/**
 * Kontrak interaksi komunitas (US-037, FR-26).
 * Waktu tanggap = menit masuk → dibalas; SLA default 30 menit
 * (nilai resmi dari Pengaturan US-041; konstanta interim di service).
 * Fase 1: mock; Fase 2: tabel `community_interactions`.
 */
export const INTERACTION_CHANNELS = ["komentar", "DM"] as const;

export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];

export const INTERACTION_TYPES = [
  "Konsultasi Teknis",
  "Pertanyaan Layanan",
  "Komplain",
  "Spam",
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export interface CommunityInteraction {
  id: string;
  channel: InteractionChannel;
  platform: string;
  brand: string;
  type: InteractionType;
  /** ISO datetime waktu masuk. */
  receivedAt: string;
  /** ISO datetime dibalas (null = belum). */
  repliedAt: string | null;
  handler: string;
}

export interface InteractionInput {
  channel: string;
  platform: string;
  brand: string;
  type: string;
  receivedAt: string;
  repliedAt?: string;
  handler: string;
}

export function isInteractionChannel(value: string): value is InteractionChannel {
  return (INTERACTION_CHANNELS as readonly string[]).includes(value);
}

export function isInteractionType(value: string): value is InteractionType {
  return (INTERACTION_TYPES as readonly string[]).includes(value);
}
