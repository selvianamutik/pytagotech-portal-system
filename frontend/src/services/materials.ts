import { mockMaterials } from "@/mocks/materials";
import { getIdea } from "@/services/ideas";
import type { ContentMaterial, MaterialInput } from "@/types/material";
import { isSosmedBrand } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan database produksi konten (US-028).
 * Penjadwalan (US-029) dan approval (US-030) menyusul di file ini.
 */

let materialStore: ContentMaterial[] = structuredClone(mockMaterials);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockMaterials(): void {
  materialStore = structuredClone(mockMaterials);
}

function cloneMaterial(material: ContentMaterial): ContentMaterial {
  return {
    ...material,
    qualityGate: { ...material.qualityGate },
    revisions: material.revisions.map((revision) => ({ ...revision })),
  };
}

const EMPTY_GATE: ContentMaterial["qualityGate"] = {
  "rasio visual": false,
  "lisensi audio": false,
  "brand cover": false,
  "link bio/CTA": false,
  "proofread copy": false,
};

function validateMaterialInput(input: MaterialInput): string | null {
  if (input.title.trim().length === 0) {
    return "Judul materi wajib diisi.";
  }
  if (!isSosmedBrand(input.brand)) {
    return "Lini bisnis tidak dikenal.";
  }
  if (input.scheduleDate && Number.isNaN(Date.parse(input.scheduleDate))) {
    return "Jadwal tayang tidak valid.";
  }
  if (input.releaseTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.releaseTime)) {
    return "Jam rilis harus format HH:MM.";
  }
  return null;
}

export async function listMaterials(): Promise<ServiceResult<ContentMaterial[]>> {
  return {
    data: [...materialStore]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((material) => cloneMaterial(material)),
    error: null,
  };
}

export async function getMaterial(
  materialId: string
): Promise<ServiceResult<ContentMaterial>> {
  const material = materialStore.find((item) => item.id === materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  return { data: cloneMaterial(material), error: null };
}

export async function createMaterial(
  input: MaterialInput
): Promise<ServiceResult<ContentMaterial>> {
  const validationError = validateMaterialInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const now = new Date().toISOString();
  const material: ContentMaterial = {
    id: `MAT-${String(materialStore.length + 18).padStart(4, "0")}`,
    title: input.title.trim(),
    brand: input.brand as ContentMaterial["brand"],
    status: "Draf",
    scheduleDate: input.scheduleDate || undefined,
    releaseTime: input.releaseTime || undefined,
    draftLink: input.draftLink.trim(),
    copywriter: input.copywriter.trim(),
    designer: input.designer.trim(),
    videoEditor: input.videoEditor.trim(),
    qualityGate: { ...EMPTY_GATE },
    revisions: [],
    createdAt: now,
  };
  materialStore.push(material);
  return { data: { ...material }, error: null };
}

/** Tulis ulang materi (dipakai US-029/US-030 untuk status & gate). */
export async function saveMaterial(
  material: ContentMaterial
): Promise<ServiceResult<ContentMaterial>> {
  const index = materialStore.findIndex((item) => item.id === material.id);
  if (index === -1) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  materialStore[index] = structuredClone(material);
  return { data: structuredClone(material), error: null };
}

/**
 * Buat materi dari ide planner (US-028): hanya ide Disetujui atau
 * Siap Masuk Produksi. Judul + brand + platform disalin.
 */
export async function createMaterialFromIdea(
  ideaId: string
): Promise<ServiceResult<ContentMaterial>> {
  const { data: idea } = await getIdea(ideaId);
  if (!idea) {
    return { data: null, error: "Ide tidak ditemukan." };
  }
  if (idea.readiness !== "Disetujui" && idea.readiness !== "Siap Masuk Produksi") {
    return {
      data: null,
      error: "Hanya ide Disetujui/Siap Produksi yang dapat menjadi materi.",
    };
  }
  return createMaterial({
    title: idea.title,
    brand: idea.brand,
    draftLink: "",
    copywriter: "",
    designer: "",
    videoEditor: "",
  }).then(async (result) => {
    if (result.data) {
      const withIdea = { ...result.data, ideaId: idea.id };
      await saveMaterial(withIdea);
      return { data: withIdea, error: null };
    }
    return result;
  });
}
