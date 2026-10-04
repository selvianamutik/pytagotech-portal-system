/**
 * Kontrak aset & content library (US-034, FR-27).
 * Hanya metadata + link cloud (Non-Goals: tanpa file master besar).
 * Fase 1: mock; Fase 2: tabel `assets`.
 */
export const ASSET_OWNERS = ["internal", "klien", "partner"] as const;

export type AssetOwner = (typeof ASSET_OWNERS)[number];

export interface Asset {
  /** Display ID (AST-xxx). */
  id: string;
  name: string;
  /** Tipe file (Figma, PSD, MP4, dsb. — teks bebas). */
  fileType: string;
  /** Link cloud (Drive/dsb.). */
  cloudLink: string;
  owner: AssetOwner;
  /** Jenis izin legal (teks bebas). */
  licenseType: string;
  /** Masa berlaku lisensi (YYYY-MM-DD; kosong = tanpa batas). */
  licenseExpiry?: string;
  createdAt: string;
}

export interface AssetInput {
  name: string;
  fileType: string;
  cloudLink: string;
  owner: string;
  licenseType: string;
  licenseExpiry?: string;
}

export function isAssetOwner(value: string): value is AssetOwner {
  return (ASSET_OWNERS as readonly string[]).includes(value);
}
