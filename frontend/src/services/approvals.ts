import { getMaterial, saveMaterial } from "@/services/materials";
import type { ApprovalDecision, MaterialRevision } from "@/types/material";
import { isApprovalDecision } from "@/types/material";
import type { ServiceResult } from "@/services/result";

/**
 * Alur approval & riwayat revisi materi (US-030).
 * Disetujui (penuh/minor) → status Disetujui (gerbang jadwal US-029);
 * Ditolak → kembali Draf dengan umpan balik wajib.
 */

export interface ReviewInput {
  decision: string;
  reviewer: string;
  feedback?: string;
  evidenceLink?: string;
}

export async function listRevisions(
  materialId: string
): Promise<ServiceResult<MaterialRevision[]>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  return {
    data: material.revisions.map((revision) => ({ ...revision })),
    error: null,
  };
}

export async function submitReview(
  materialId: string,
  input: ReviewInput
): Promise<ServiceResult<MaterialRevision>> {
  if (!isApprovalDecision(input.decision)) {
    return { data: null, error: "Keputusan review tidak dikenal." };
  }
  if (input.reviewer.trim().length === 0) {
    return { data: null, error: "Nama reviewer wajib diisi." };
  }
  const feedback = (input.feedback ?? "").trim();
  if (input.decision === "Ditolak" && !feedback) {
    return { data: null, error: "Umpan balik wajib saat materi Ditolak." };
  }
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }

  const revision: MaterialRevision = {
    version: material.revisions.length,
    reviewer: input.reviewer.trim(),
    decision: input.decision as ApprovalDecision,
    feedback,
    evidenceLink: (input.evidenceLink ?? "").trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const updated = {
    ...material,
    revisions: [...material.revisions, revision],
    status:
      input.decision === "Ditolak"
        ? ("Draf" as const)
        : ("Disetujui" as const),
  };
  await saveMaterial(updated);
  return { data: { ...revision }, error: null };
}
