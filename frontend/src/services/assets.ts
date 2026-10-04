import { mockAssets } from "@/mocks/assets";
import { getMaterial, saveMaterial } from "@/services/materials";
import type { Asset, AssetInput } from "@/types/asset";
import { isAssetOwner } from "@/types/asset";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan aset & content library (US-034, FR-27).
 * Peringatan 30 hari; kedaluwarsa tidak dapat ditautkan ke materi baru.
 */

/** Ambang peringatan kedaluwarsa (hari). */
export const EXPIRY_WARNING_DAYS = 30;

let assetStore: Asset[] = structuredClone(mockAssets);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockAssets(): void {
  assetStore = structuredClone(mockAssets);
}

function validateAssetInput(input: AssetInput): string | null {
  if (input.name.trim().length === 0) {
    return "Nama aset wajib diisi.";
  }
  if (input.fileType.trim().length === 0) {
    return "Tipe file wajib diisi.";
  }
  if (!isAssetOwner(input.owner)) {
    return "Pemilik harus internal, klien, atau partner.";
  }
  if (input.licenseType.trim().length === 0) {
    return "Jenis izin legal wajib diisi.";
  }
  if (input.licenseExpiry && Number.isNaN(Date.parse(input.licenseExpiry))) {
    return "Masa berlaku lisensi tidak valid.";
  }
  return null;
}

export async function listAssets(): Promise<ServiceResult<Asset[]>> {
  return {
    data: [...assetStore]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((asset) => ({ ...asset })),
    error: null,
  };
}

export async function createAsset(input: AssetInput): Promise<ServiceResult<Asset>> {
  const validationError = validateAssetInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  const asset: Asset = {
    id: `AST-${String(assetStore.length + 1).padStart(3, "0")}`,
    name: input.name.trim(),
    fileType: input.fileType.trim(),
    cloudLink: input.cloudLink.trim(),
    owner: input.owner as Asset["owner"],
    licenseType: input.licenseType.trim(),
    licenseExpiry: input.licenseExpiry || undefined,
    createdAt: new Date().toISOString(),
  };
  assetStore.push(asset);
  return { data: { ...asset }, error: null };
}

export async function updateAsset(
  assetId: string,
  input: AssetInput
): Promise<ServiceResult<Asset>> {
  const asset = assetStore.find((item) => item.id === assetId);
  if (!asset) {
    return { data: null, error: "Aset tidak ditemukan." };
  }
  const validationError = validateAssetInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  asset.name = input.name.trim();
  asset.fileType = input.fileType.trim();
  asset.cloudLink = input.cloudLink.trim();
  asset.owner = input.owner as Asset["owner"];
  asset.licenseType = input.licenseType.trim();
  asset.licenseExpiry = input.licenseExpiry || undefined;
  return { data: { ...asset }, error: null };
}

export async function deleteAsset(assetId: string): Promise<ServiceResult<true>> {
  const index = assetStore.findIndex((item) => item.id === assetId);
  if (index === -1) {
    return { data: null, error: "Aset tidak ditemukan." };
  }
  assetStore.splice(index, 1);
  return { data: true, error: null };
}

/** True bila lisensi sudah lewat hari ini (tanpa batas = tidak pernah). */
export function isAssetExpired(asset: Asset, todayIso: string): boolean {
  return Boolean(asset.licenseExpiry) && (asset.licenseExpiry as string) < todayIso;
}

/** Hari tersisa hingga kedaluwarsa (null bila tanpa batas). */
export function daysToExpiry(asset: Asset, todayIso: string): number | null {
  if (!asset.licenseExpiry) {
    return null;
  }
  const diff =
    new Date(`${asset.licenseExpiry}T00:00:00Z`).getTime() -
    new Date(`${todayIso}T00:00:00Z`).getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

/** Aset layak taut: belum kedaluwarsa (FR-27). */
export function canLinkAsset(asset: Asset, todayIso: string): boolean {
  return !isAssetExpired(asset, todayIso);
}

export interface AssetWithStatus extends Asset {
  expired: boolean;
  expiringSoon: boolean;
  daysLeft: number | null;
}

/** Daftar aset + status kedaluwarsa (peringatan ≤30 hari). */export async function listAssetsWithStatus(
  todayIso: string = new Date().toISOString().slice(0, 10)
): Promise<ServiceResult<AssetWithStatus[]>> {
  const { data } = await listAssets();
  return {
    data: (data ?? []).map((asset) => {
      const daysLeft = daysToExpiry(asset, todayIso);
      return {
        ...asset,
        expired: isAssetExpired(asset, todayIso),
        expiringSoon:
          !isAssetExpired(asset, todayIso) &&
          daysLeft !== null &&
          daysLeft <= EXPIRY_WARNING_DAYS,
        daysLeft,
      };
    }),
    error: null,
  };
}

/**
 * Tautkan aset ke materi (US-034, FR-27): aset kedaluwarsa ditolak
 * dengan pesan jelas.
 */
export async function linkAssetsToMaterial(
  materialId: string,
  assetIds: string[],
  todayIso: string = new Date().toISOString().slice(0, 10)
): Promise<ServiceResult<string[]>> {
  const { data: material } = await getMaterial(materialId);
  if (!material) {
    return { data: null, error: "Materi tidak ditemukan." };
  }
  const rejected: string[] = [];
  const accepted: string[] = [];
  for (const assetId of new Set(assetIds)) {
    const asset = assetStore.find((item) => item.id === assetId);
    if (!asset) {
      rejected.push(`${assetId} (tidak dikenal)`);
    } else if (!canLinkAsset(asset, todayIso)) {
      rejected.push(`${asset.id} ${asset.name} (lisensi kedaluwarsa)`);
    } else {
      accepted.push(asset.id);
    }
  }
  if (rejected.length > 0) {
    return { data: null, error: `Tidak dapat ditautkan: ${rejected.join("; ")}.` };
  }
  material.linkedAssetIds = accepted;
  await saveMaterial(material);
  return { data: accepted, error: null };
}
