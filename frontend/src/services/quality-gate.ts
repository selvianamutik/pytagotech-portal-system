import { getMaterial, saveMaterial } from "@/services/materials";
import type { QualityGateItem } from "@/types/material";
import { isQualityGateComplete, QUALITY_GATE_ITEMS } from "@/types/material";
import type { ServiceResult } from "@/services/result";

/**
 * Quality gate pra-rilis (US-029): 5 checklist; materi tidak dapat
 * dijadwalkan/dirilis bila belum lengkap, kecuali Admin beralasan.
 * Penjadwalan mensyaratkan status Disetujui (US-030).
 */

export interface GateActor {
  name: string;
  roles: string[];
}

function isAdmin(actor: GateActor): boolean {
  return actor.roles.includes("Super Admin");
}

export async function setGateItem(
  materialId: string,
  item: QualityGateItem,
  checked: boolean
): Promise<ServiceResult<true>> {
  if (!(QUALITY_GATE_ITEMS as readonly string[]).includes(item)) {
    return { data: null, error: "Item checklist tidak dikenal." };
  }
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  material.qualityGate[item] = checked;
  // Checklist diubah → pengecualian lama kedaluwarsa.
  material.gateOverride = undefined;
  await saveMaterial(material);
  return { data: true, error: null };
}

export interface ScheduleMaterialInput {
  scheduleDate: string;
  releaseTime?: string;
  /** Wajib bila gate belum lengkap dan aktor Admin. */
  overrideReason?: string;
}

/**
 * Jadwalkan materi: wajib Disetujui + gate lengkap,
 * atau Admin dengan alasan pengecualian.
 */
export async function scheduleMaterial(
  materialId: string,
  input: ScheduleMaterialInput,
  actor: GateActor
): Promise<ServiceResult<true>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  if (material.status !== "Disetujui" && material.status !== "Dijadwalkan") {
    return { data: null, error: "Hanya materi Disetujui yang dapat dijadwalkan (US-030)." };
  }
  if (!input.scheduleDate || Number.isNaN(Date.parse(input.scheduleDate))) {
    return { data: null, error: "Jadwal tayang tidak valid." };
  }
  if (!isQualityGateComplete(material.qualityGate)) {
    const reason = (input.overrideReason ?? "").trim();
    if (!isAdmin(actor)) {
      return { data: null, error: "Checklist belum lengkap. Minta pengecualian Admin." };
    }
    if (!reason) {
      return { data: null, error: "Pengecualian Admin wajib disertai alasan." };
    }
    material.gateOverride = { by: actor.name, reason };
  } else {
    material.gateOverride = undefined;
  }
  material.scheduleDate = input.scheduleDate;
  if (input.releaseTime) {
    material.releaseTime = input.releaseTime;
  }
  material.status = "Dijadwalkan";
  await saveMaterial(material);
  return { data: true, error: null };
}

/** Tandai materi rilis: wajib Dijadwalkan + gate lengkap (atau override Admin). */
export async function releaseMaterial(
  materialId: string,
  actor: GateActor,
  overrideReason?: string
): Promise<ServiceResult<true>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  if (material.status !== "Dijadwalkan") {
    return { data: null, error: "Hanya materi Dijadwalkan yang dapat dirilis." };
  }
  if (!isQualityGateComplete(material.qualityGate)) {
    const reason = (overrideReason ?? "").trim();
    if (!isAdmin(actor) || !reason) {
      return {
        data: null,
        error: "Checklist belum lengkap. Rilis butuh gate penuh atau pengecualian Admin beralasan.",
      };
    }
    material.gateOverride = { by: actor.name, reason };
  }
  material.status = "Rilis";
  await saveMaterial(material);
  return { data: true, error: null };
}
