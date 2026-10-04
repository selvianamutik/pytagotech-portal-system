import { getIdea } from "@/services/ideas";
import { getMaterial } from "@/services/materials";
import type { Publication } from "@/types/publication";
import { isDistributionPattern } from "@/types/publication";
import { isSosmedPlatform, SOSMED_PLATFORMS } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan distribusi multiplatform Parent-Child (US-031, FR-23).
 * Rilis aktual (US-033) dan metrik (US-035) menyusul di file ini.
 */

let publicationStore: Publication[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockPublications(): void {
  publicationStore = [];
}

export async function listPublications(
  materialId?: string
): Promise<ServiceResult<Publication[]>> {
  const items = materialId
    ? publicationStore.filter((publication) => publication.materialId === materialId)
    : publicationStore;
  return {
    data: [...items]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((publication) => ({ ...publication })),
    error: null,
  };
}

/**
 * Platform tujuan materi: dari ide asal bila ada, selain itu
 * seluruh 5 platform. Dasar indikator rekonsiliasi.
 */
export async function getTargetPlatforms(
  materialId: string
): Promise<ServiceResult<string[]>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  if (material.ideaId) {
    const { data: idea } = await getIdea(material.ideaId);
    if (idea) {
      return { data: [...idea.targetPlatforms], error: null };
    }
  }
  return { data: [...SOSMED_PLATFORMS], error: null };
}

/** Platform tujuan yang belum memiliki publikasi (peringatan rekonsiliasi). */
export async function getUncoveredPlatforms(
  materialId: string
): Promise<ServiceResult<string[]>> {
  const [{ data: targets }, { data: publications }] = await Promise.all([
    getTargetPlatforms(materialId),
    listPublications(materialId),
  ]);
  const covered: Set<string> = new Set(
    (publications ?? []).map((publication) => publication.platform)
  );
  return { data: (targets ?? []).filter((platform) => !covered.has(platform)), error: null };
}

export async function createPublication(
  materialId: string,
  platform: string,
  pattern: string
): Promise<ServiceResult<Publication>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  if (!isSosmedPlatform(platform)) {
    return { data: null, error: "Platform tidak dikenal." };
  }
  if (!isDistributionPattern(pattern)) {
    return { data: null, error: "Pola harus Single atau Crosspost." };
  }
  const { data: existing } = await listPublications(materialId);
  if ((existing ?? []).some((publication) => publication.platform === platform)) {
    return { data: null, error: `Publikasi ${platform} sudah ada untuk materi ini.` };
  }
  const publication: Publication = {
    id: `PUB-${String(publicationStore.length + 1).padStart(4, "0")}`,
    materialId,
    platform,
    pattern,
    scheduleDate: material.scheduleDate,
    createdAt: new Date().toISOString(),
  };
  publicationStore.push(publication);
  return { data: { ...publication }, error: null };
}

export async function deletePublication(publicationId: string): Promise<ServiceResult<true>> {
  const index = publicationStore.findIndex((item) => item.id === publicationId);
  if (index === -1) {
    return { data: null, error: "Publikasi tidak ditemukan." };
  }
  publicationStore.splice(index, 1);
  return { data: true, error: null };
}

/** Tulis ulang publikasi (dipakai US-032 jadwal ulang & US-033 rilis). */
export async function savePublication(
  publication: Publication
): Promise<ServiceResult<Publication>> {
  const index = publicationStore.findIndex((item) => item.id === publication.id);
  if (index === -1) {
    return { data: null, error: "Publikasi tidak ditemukan." };
  }
  publicationStore[index] = { ...publication };
  return { data: { ...publication }, error: null };
}

export interface RecordReleaseInput {
  releaseDate: string;
  liveLink: string;
}

/**
 * Catat rilis aktual + link post live (US-033). Setelah live,
 * publikasi terkunci dari jadwal ulang (US-032).
 */
export async function recordRelease(
  publicationId: string,
  input: RecordReleaseInput
): Promise<ServiceResult<Publication>> {
  const publication = publicationStore.find((item) => item.id === publicationId);
  if (!publication) {
    return { data: null, error: "Publikasi tidak ditemukan." };
  }
  if (!input.releaseDate || Number.isNaN(Date.parse(input.releaseDate))) {
    return { data: null, error: "Tanggal aktual rilis tidak valid." };
  }
  if (!input.liveLink.trim()) {
    return { data: null, error: "Link post live wajib diisi." };
  }
  publication.releaseDate = input.releaseDate;
  publication.liveLink = input.liveLink.trim();
  return { data: { ...publication }, error: null };
}
