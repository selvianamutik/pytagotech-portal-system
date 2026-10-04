import type { CommunityInteraction, InteractionInput } from "@/types/community";
import { isInteractionChannel, isInteractionType } from "@/types/community";
import { isSosmedPlatform } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan community management (US-037, FR-26).
 * Ambang SLA interim 30 menit (resmi dari Pengaturan US-041).
 */

/** Ambang SLA respons komunitas — menit (interim; US-041 menjadi acuan). */
export const RESPONSE_SLA_MINUTES = 30;

let interactionStore: CommunityInteraction[] = [
  {
    id: "INT-001",
    channel: "komentar",
    platform: "Instagram",
    type: "Pertanyaan Layanan",
    receivedAt: "2026-10-04T01:00:00Z",
    repliedAt: "2026-10-04T01:18:00Z",
    handler: "Alya",
  },
  {
    id: "INT-002",
    channel: "DM",
    platform: "TikTok",
    type: "Komplain",
    receivedAt: "2026-10-04T02:00:00Z",
    repliedAt: null,
    handler: "Alya",
  },
];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockInteractions(): void {
  interactionStore = [
    {
      id: "INT-001",
      channel: "komentar",
      platform: "Instagram",
      type: "Pertanyaan Layanan",
      receivedAt: "2026-10-04T01:00:00Z",
      repliedAt: "2026-10-04T01:18:00Z",
      handler: "Alya",
    },
    {
      id: "INT-002",
      channel: "DM",
      platform: "TikTok",
      type: "Komplain",
      receivedAt: "2026-10-04T02:00:00Z",
      repliedAt: null,
      handler: "Alya",
    },
  ];
}

/** Menit masuk → dibalas (null bila belum dibalas). */
export function responseMinutes(interaction: {
  receivedAt: string;
  repliedAt: string | null;
}): number | null {
  if (!interaction.repliedAt) {
    return null;
  }
  return Math.round(
    (new Date(interaction.repliedAt).getTime() - new Date(interaction.receivedAt).getTime()) /
      60000
  );
}

/** Tercapai bila dibalas ≤ ambang SLA. */
export function isSlaMet(
  interaction: { receivedAt: string; repliedAt: string | null },
  slaMinutes: number = RESPONSE_SLA_MINUTES
): boolean {
  const minutes = responseMinutes(interaction);
  return minutes !== null && minutes <= slaMinutes;
}

function validateInteractionInput(input: InteractionInput): string | null {
  if (!isInteractionChannel(input.channel)) {
    return "Kanal harus komentar atau DM.";
  }
  if (!isSosmedPlatform(input.platform)) {
    return "Platform tidak dikenal.";
  }
  if (!isInteractionType(input.type)) {
    return "Tipe interaksi tidak dikenal.";
  }
  if (Number.isNaN(Date.parse(input.receivedAt))) {
    return "Waktu masuk tidak valid.";
  }
  if (input.repliedAt && Number.isNaN(Date.parse(input.repliedAt))) {
    return "Waktu dibalas tidak valid.";
  }
  if (input.repliedAt && Date.parse(input.repliedAt) < Date.parse(input.receivedAt)) {
    return "Waktu dibalas tidak boleh sebelum waktu masuk.";
  }
  return null;
}

export async function listInteractions(): Promise<ServiceResult<CommunityInteraction[]>> {
  return {
    data: [...interactionStore]
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .map((interaction) => ({ ...interaction })),
    error: null,
  };
}

export async function recordInteraction(
  input: InteractionInput
): Promise<ServiceResult<CommunityInteraction>> {
  const validationError = validateInteractionInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const interaction: CommunityInteraction = {
    id: `INT-${String(interactionStore.length + 1).padStart(3, "0")}`,
    channel: input.channel as CommunityInteraction["channel"],
    platform: input.platform,
    type: input.type as CommunityInteraction["type"],
    receivedAt: new Date(input.receivedAt).toISOString(),
    repliedAt: input.repliedAt ? new Date(input.repliedAt).toISOString() : null,
    handler: input.handler.trim(),
  };
  interactionStore.push(interaction);
  return { data: { ...interaction }, error: null };
}

export async function markInteractionReplied(
  interactionId: string,
  repliedAt: string
): Promise<ServiceResult<CommunityInteraction>> {
  const interaction = interactionStore.find((item) => item.id === interactionId);
  if (!interaction) {
    return { data: null, error: "Interaksi tidak ditemukan." };
  }
  if (!repliedAt || Number.isNaN(Date.parse(repliedAt))) {
    return { data: null, error: "Waktu dibalas tidak valid." };
  }
  if (Date.parse(repliedAt) < Date.parse(interaction.receivedAt)) {
    return { data: null, error: "Waktu dibalas tidak boleh sebelum waktu masuk." };
  }
  interaction.repliedAt = new Date(repliedAt).toISOString();
  return { data: { ...interaction }, error: null };
}

/** Persentase SLA tercapai (untuk dashboard Sosmed US-039). */
export async function getSlaCompliance(): Promise<
  ServiceResult<{ answered: number; met: number; percent: number }>
> {
  const answered = interactionStore.filter((interaction) => interaction.repliedAt);
  const met = answered.filter((interaction) => isSlaMet(interaction)).length;
  return {
    data: {
      answered: answered.length,
      met,
      percent: answered.length > 0 ? (met / answered.length) * 100 : 0,
    },
    error: null,
  };
}
