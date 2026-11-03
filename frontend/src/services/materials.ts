import { createClient } from "@/lib/supabase/client";
import { getIdea } from "@/services/ideas";
import type { ServiceResult } from "@/services/result";
import type { ContentMaterial, MaterialInput, MaterialRevision, QualityGateItem } from "@/types/material";
import { isSosmedBrand } from "@/types/sosmed";

type Row = Record<string, unknown> & { id: string; display_id: string; title: string; brand: string; status: string; created_at: string };
const GATE: QualityGateItem[] = ["rasio visual", "lisensi audio", "brand cover", "link bio/CTA", "proofread copy"];
export function resetMockMaterials(): void {}

async function resolveMember(name: string): Promise<string | null> {
  if (!name.trim()) return null;
  const { data } = await createClient().from("team_members").select("id").eq("name", name.trim()).limit(1);
  return ((data ?? []) as { id: string }[])[0]?.id ?? null;
}
async function resolveIdea(id?: string): Promise<string | null> {
  if (!id) return null;
  const { data } = await createClient().from("content_ideas").select("id").eq("display_id", id).limit(1);
  return ((data ?? []) as { id: string }[])[0]?.id ?? null;
}
async function map(row: Row): Promise<ServiceResult<ContentMaterial>> {
  const db = createClient();
  const [rev, assets, people] = await Promise.all([
    db.from("content_revisions").select("version,reviewer,decision,feedback,evidence_link,created_at").eq("material_id", row.id).order("version"),
    db.from("material_assets").select("asset_id").eq("material_id", row.id),
    Promise.all([row["copywriter_id"], row["designer_id"], row["video_editor_id"]].map(async (id) => {
      if (typeof id !== "string") return "";
      const { data } = await db.from("team_members").select("name").eq("id", id).limit(1);
      return ((data ?? []) as { name: string }[])[0]?.name ?? "";
    })),
  ]);
  const err = rev.error ?? assets.error;
  if (err) return { data: null, error: err.message };
  const overrideId = row["gate_override_by"] as string | null;
  let overrideName = "";
  if (overrideId) {
    const { data } = await db.from("team_members").select("name").eq("id", overrideId).limit(1);
    overrideName = ((data ?? []) as { name: string }[])[0]?.name ?? "";
  }
  const ideaId = row["idea_id"] as string | null;
  let ideaDisplay: string | undefined;
  if (ideaId) {
    const { data } = await db.from("content_ideas").select("display_id").eq("id", ideaId).limit(1);
    ideaDisplay = ((data ?? []) as { display_id: string }[])[0]?.display_id;
  }
  const gate = Object.fromEntries(GATE.map((key, i) => [key, Boolean(row[["gate_visual", "gate_audio", "gate_cover", "gate_cta", "gate_proofread"][i]])])) as ContentMaterial["qualityGate"];
  const revisions = ((rev.data ?? []) as Record<string, unknown>[]).map((r) => ({ version: Number(r["version"]), reviewer: String(r["reviewer"]), decision: r["decision"] as MaterialRevision["decision"], feedback: String(r["feedback"] ?? ""), evidenceLink: (r["evidence_link"] as string | null) ?? undefined, createdAt: String(r["created_at"]) }));
  return { data: { id: row.display_id, title: row.title, brand: row.brand as ContentMaterial["brand"], status: row.status as ContentMaterial["status"], scheduleDate: row["schedule_date"] as string | undefined, releaseTime: row["release_time"] as string | undefined, draftLink: String(row["draft_link"] ?? ""), copywriter: people[0], designer: people[1], videoEditor: people[2], ideaId: ideaDisplay, qualityGate: gate, gateOverride: overrideId ? { by: overrideName, reason: String(row["gate_override_reason"] ?? "") } : undefined, revisions, linkedAssetIds: ((assets.data ?? []) as { asset_id: string }[]).map((a) => a.asset_id), createdAt: row.created_at }, error: null };
}
export async function listMaterials(): Promise<ServiceResult<ContentMaterial[]>> {
  const { data, error } = await createClient().from("content_materials").select("*").order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  const rows = await Promise.all(((data ?? []) as Row[]).map(map));
  const failed = rows.find((x) => x.error);
  return failed?.error ? { data: null, error: failed.error } : { data: rows.flatMap((x) => x.data ? [x.data] : []), error: null };
}
export async function getMaterial(id: string): Promise<ServiceResult<ContentMaterial>> {
  const { data, error } = await createClient().from("content_materials").select("*").eq("display_id", id).limit(1);
  if (error) return { data: null, error: error.message };
  const row = ((data ?? []) as Row[])[0];
  return row ? map(row) : { data: null, error: "Materi tidak ditemukan." };
}
function validate(input: MaterialInput): string | null {
  if (!input.title.trim()) return "Judul materi wajib diisi.";
  if (!isSosmedBrand(input.brand)) return "Lini bisnis tidak dikenal.";
  if (input.scheduleDate && Number.isNaN(Date.parse(input.scheduleDate))) return "Jadwal tayang tidak valid.";
  if (input.releaseTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.releaseTime)) return "Jam rilis harus format HH:MM.";
  return null;
}
export async function createMaterial(input: MaterialInput): Promise<ServiceResult<ContentMaterial>> {
  const v = validate(input); if (v) return { data: null, error: v };
  const db = createClient();
  const [copywriter, designer, editor] = await Promise.all([resolveMember(input.copywriter), resolveMember(input.designer), resolveMember(input.videoEditor)]);
  const { data, error } = await db.from("content_materials").insert({ title: input.title.trim(), brand: input.brand, schedule_date: input.scheduleDate || null, release_time: input.releaseTime || null, draft_link: input.draftLink.trim() || null, copywriter_id: copywriter, designer_id: designer, video_editor_id: editor }).select("*").single();
  return error ? { data: null, error: error.message } : map(data as Row);
}
export async function saveMaterial(material: ContentMaterial): Promise<ServiceResult<ContentMaterial>> {
  const db = createClient();
  const [copywriter, designer, editor, idea] = await Promise.all([resolveMember(material.copywriter), resolveMember(material.designer), resolveMember(material.videoEditor), resolveIdea(material.ideaId)]);
  const gateCols = ["gate_visual", "gate_audio", "gate_cover", "gate_cta", "gate_proofread"];
  const patch: Record<string, unknown> = { title: material.title, brand: material.brand, status: material.status, schedule_date: material.scheduleDate ?? null, release_time: material.releaseTime ?? null, draft_link: material.draftLink || null, copywriter_id: copywriter, designer_id: designer, video_editor_id: editor, idea_id: idea, gate_override_by: material.gateOverride ? await resolveMember(material.gateOverride.by) : null, gate_override_reason: material.gateOverride?.reason ?? null };
  GATE.forEach((key, i) => { patch[gateCols[i]!] = material.qualityGate[key]; });
  const { data: found, error: findError } = await db.from("content_materials").select("id").eq("display_id", material.id).limit(1);
  if (findError) return { data: null, error: findError.message };
  const row = ((found ?? []) as { id: string }[])[0]; if (!row) return { data: null, error: "Materi tidak ditemukan." };
  const { data, error } = await db.from("content_materials").update(patch).eq("id", row.id).select("*").single();
  return error ? { data: null, error: error.message } : map(data as Row);
}
export async function createMaterialFromIdea(id: string): Promise<ServiceResult<ContentMaterial>> {
  const { data: idea, error } = await getIdea(id);
  if (error || !idea) return { data: null, error: error ?? "Ide tidak ditemukan." };
  if (idea.readiness !== "Disetujui" && idea.readiness !== "Siap Masuk Produksi") return { data: null, error: "Hanya ide Disetujui/Siap Produksi yang dapat menjadi materi." };
  const result = await createMaterial({ title: idea.title, brand: idea.brand, draftLink: "", copywriter: "", designer: "", videoEditor: "" });
  if (!result.data) return result;
  result.data.ideaId = id;
  return saveMaterial(result.data);
}
