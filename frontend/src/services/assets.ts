import { createClient } from "@/lib/supabase/client";
import { resolveDisplayUuid } from "@/services/production-refs";
import type { Asset, AssetInput } from "@/types/asset";
import { isAssetOwner } from "@/types/asset";
import type { ServiceResult } from "@/services/result";

/** Aset metadata/link cloud; file master tetap di penyimpanan eksternal. */
export const EXPIRY_WARNING_DAYS = 30;
type Row = Record<string, unknown> & { id: string; display_id: string; name: string; file_type: string; cloud_link: string; owner: string; license_type: string; created_at: string };
export function resetMockAssets(): void {}
const map = (row: Row): Asset => ({ id: row.display_id, name: row.name, fileType: row.file_type, cloudLink: row.cloud_link, owner: row.owner as Asset["owner"], licenseType: row.license_type, licenseExpiry: (row.license_expiry as string | null) ?? undefined, createdAt: row.created_at });
function validate(input: AssetInput): string | null {
  if (!input.name.trim()) return "Nama aset wajib diisi.";
  if (!input.fileType.trim()) return "Tipe file wajib diisi.";
  if (!isAssetOwner(input.owner)) return "Pemilik harus internal, klien, atau partner.";
  if (!input.licenseType.trim()) return "Jenis izin legal wajib diisi.";
  if (input.licenseExpiry && Number.isNaN(Date.parse(input.licenseExpiry))) return "Masa berlaku lisensi tidak valid.";
  return null;
}
const payload = (input: AssetInput) => ({ name: input.name.trim(), file_type: input.fileType.trim(), cloud_link: input.cloudLink.trim(), owner: input.owner, license_type: input.licenseType.trim(), license_expiry: input.licenseExpiry || null });
export async function listAssets(): Promise<ServiceResult<Asset[]>> {
  const { data, error } = await createClient().from("assets").select("*").order("name");
  return error ? { data: null, error: error.message } : { data: ((data ?? []) as Row[]).map(map), error: null };
}
export async function createAsset(input: AssetInput): Promise<ServiceResult<Asset>> {
  const error = validate(input); if (error) return { data: null, error };
  const result = await createClient().from("assets").insert(payload(input)).select("*").single();
  return result.error ? { data: null, error: result.error.message } : { data: map(result.data as Row), error: null };
}
export async function updateAsset(id: string, input: AssetInput): Promise<ServiceResult<Asset>> {
  const error = validate(input); if (error) return { data: null, error };
  const found = await resolveDisplayUuid("assets", id, "Aset"); if (!found.data) return { data: null, error: found.error };
  const result = await createClient().from("assets").update(payload(input)).eq("id", found.data).select("*").single();
  return result.error ? { data: null, error: result.error.message } : { data: map(result.data as Row), error: null };
}
export async function deleteAsset(id: string): Promise<ServiceResult<true>> {
  const found = await resolveDisplayUuid("assets", id, "Aset"); if (!found.data) return { data: null, error: found.error };
  const { error } = await createClient().from("assets").delete().eq("id", found.data);
  return error ? { data: null, error: error.message } : { data: true, error: null };
}
export function isAssetExpired(asset: Asset, today: string): boolean { return Boolean(asset.licenseExpiry && asset.licenseExpiry < today); }
export function daysToExpiry(asset: Asset, today: string): number | null { return asset.licenseExpiry ? Math.round((Date.parse(`${asset.licenseExpiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000) : null; }
export function canLinkAsset(asset: Asset, today: string): boolean { return !isAssetExpired(asset, today); }
export interface AssetWithStatus extends Asset { expired: boolean; expiringSoon: boolean; daysLeft: number | null; }
export async function listAssetsWithStatus(today = new Date().toISOString().slice(0, 10)): Promise<ServiceResult<AssetWithStatus[]>> {
  const result = await listAssets(); if (!result.data) return result as ServiceResult<AssetWithStatus[]>;
  return { data: result.data.map((asset) => { const daysLeft = daysToExpiry(asset, today); return { ...asset, daysLeft, expired: isAssetExpired(asset, today), expiringSoon: daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRY_WARNING_DAYS }; }), error: null };
}
export async function linkAssetsToMaterial(materialId: string, assetIds: string[], today = new Date().toISOString().slice(0, 10)): Promise<ServiceResult<string[]>> {
  const [material, assets] = await Promise.all([resolveDisplayUuid("content_materials", materialId, "Materi"), listAssets()]);
  if (!material.data) return { data: null, error: material.error }; if (!assets.data) return { data: null, error: assets.error };
  const requested = new Set(assetIds); const byId = new Map(assets.data.map((asset) => [asset.id, asset])); const selected = assetIds.filter((id) => requested.has(id)).flatMap((id) => byId.get(id) ? [byId.get(id)!] : []);
  if (selected.length !== requested.size) return { data: null, error: "Satu atau lebih aset tidak ditemukan." };
  const expired = selected.filter((a) => !canLinkAsset(a, today)); if (expired.length) return { data: null, error: `Tidak dapat ditautkan: ${expired.map((a) => `${a.id} ${a.name}`).join(", ")} (lisensi kedaluwarsa).` };
  const ids = await Promise.all(selected.map((a) => resolveDisplayUuid("assets", a.id, "Aset")));
  const invalid = ids.find((x) => !x.data); if (invalid) return { data: null, error: invalid.error };
  const db = createClient(); const { error: removeError } = await db.from("material_assets").delete().eq("material_id", material.data);
  if (removeError) return { data: null, error: removeError.message };
  if (ids.length) { const { error } = await db.from("material_assets").insert(ids.map((a) => ({ material_id: material.data, asset_id: a.data! }))); if (error) return { data: null, error: error.message }; }
  return { data: selected.map((a) => a.id), error: null };
}
