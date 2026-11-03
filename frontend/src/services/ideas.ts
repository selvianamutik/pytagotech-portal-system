import { createClient } from "@/lib/supabase/client";
import type { ContentIdea, IdeaInput } from "@/types/content-idea";
import { briefScore, isIdeaFunnel, isIdeaReadiness } from "@/types/content-idea";
import { isSosmedBrand, isSosmedPlatform, SOSMED_PLATFORMS } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

type IdeaRow = {
  id: string; display_id: string; title: string; brand: string; pillar: string;
  funnel: string; hook: string | null; angle: string | null; key_points: string | null;
  cta: string | null; asset_ref: string | null; readiness: string; created_at: string;
};

function validate(input: IdeaInput): string | null {
  if (!input.title.trim()) return "Judul ide wajib diisi.";
  if (!isSosmedBrand(input.brand)) return "Lini bisnis tidak dikenal.";
  if (!input.pillar.trim()) return "Pillar wajib diisi.";
  if (!isIdeaFunnel(input.funnel)) return "Funnel harus Awareness, Consideration, atau Conversion.";
  if (!input.targetPlatforms.length || input.targetPlatforms.some((p) => !isSosmedPlatform(p))) return "Pilih platform target yang valid.";
  if (!isIdeaReadiness(input.readiness)) return "Status kelayakan tidak dikenal.";
  return readinessAllowed(input.readiness, briefScore(input.brief));
}

export function readinessAllowed(readiness: string, score: number): string | null {
  return readiness === "Siap Masuk Produksi" && score < 5
    ? `Skor brief ${score}/5 — "Siap Masuk Produksi" mensyaratkan 5/5.` : null;
}

async function mapRow(row: IdeaRow): Promise<ServiceResult<ContentIdea>> {
  const { data: platforms, error } = await createClient().from("idea_platforms").select("platform").eq("idea_id", row.id);
  if (error) return { data: null, error: error.message };
  return { data: {
    id: row.display_id, title: row.title, brand: row.brand as ContentIdea["brand"], pillar: row.pillar,
    funnel: row.funnel as ContentIdea["funnel"], targetPlatforms: ((platforms ?? []) as { platform: ContentIdea["targetPlatforms"][number] }[]).map((p) => p.platform),
    brief: { hook: row.hook ?? "", angle: row.angle ?? "", keyPoints: row.key_points ?? "", cta: row.cta ?? "", assetRef: row.asset_ref ?? "" },
    readiness: row.readiness as ContentIdea["readiness"], createdAt: row.created_at,
  }, error: null };
}

export function resetMockIdeas(): void {}

export async function listIdeas(): Promise<ServiceResult<ContentIdea[]>> {
  const { data, error } = await createClient().from("content_ideas").select("*").order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  const results = await Promise.all(((data ?? []) as IdeaRow[]).map(mapRow));
  const failed = results.find((r) => r.error);
  return failed?.error ? { data: null, error: failed.error } : { data: results.flatMap((r) => r.data ? [r.data] : []), error: null };
}

export async function getIdea(id: string): Promise<ServiceResult<ContentIdea>> {
  const { data, error } = await createClient().from("content_ideas").select("*").eq("display_id", id).limit(1);
  if (error) return { data: null, error: error.message };
  const row = ((data ?? []) as IdeaRow[])[0];
  return row ? mapRow(row) : { data: null, error: "Ide tidak ditemukan." };
}

export async function createIdea(input: IdeaInput): Promise<ServiceResult<ContentIdea>> {
  const validation = validate(input);
  if (validation) return { data: null, error: validation };
  const brief = input.brief;
  const db = createClient();
  const { data, error } = await db.from("content_ideas").insert({
    title: input.title.trim(), brand: input.brand, pillar: input.pillar.trim(), funnel: input.funnel,
    hook: brief.hook.trim() || null, angle: brief.angle.trim() || null, key_points: brief.keyPoints.trim() || null,
    cta: brief.cta.trim() || null, asset_ref: brief.assetRef.trim() || null, readiness: input.readiness,
  }).select("*").single();
  if (error) return { data: null, error: error.message };
  const row = data as IdeaRow;
  const { error: platformError } = await db.from("idea_platforms").insert(input.targetPlatforms.map((platform) => ({ idea_id: row.id, platform })));
  if (platformError) {
    await db.from("content_ideas").delete().eq("id", row.id);
    return { data: null, error: platformError.message };
  }
  return mapRow(row);
}

export async function updateIdea(id: string, input: IdeaInput): Promise<ServiceResult<ContentIdea>> {
  const validation = validate(input);
  if (validation) return { data: null, error: validation };
  const db = createClient();
  const { data: found, error: findError } = await db.from("content_ideas").select("id").eq("display_id", id).limit(1);
  if (findError) return { data: null, error: findError.message };
  const row = ((found ?? []) as { id: string }[])[0];
  if (!row) return { data: null, error: "Ide tidak ditemukan." };
  const b = input.brief;
  const { data, error } = await db.from("content_ideas").update({ title: input.title.trim(), brand: input.brand, pillar: input.pillar.trim(), funnel: input.funnel, hook: b.hook.trim() || null, angle: b.angle.trim() || null, key_points: b.keyPoints.trim() || null, cta: b.cta.trim() || null, asset_ref: b.assetRef.trim() || null, readiness: input.readiness }).eq("id", row.id).select("*").single();
  if (error) return { data: null, error: error.message };
  const { error: deleteError } = await db.from("idea_platforms").delete().eq("idea_id", row.id);
  if (deleteError) return { data: null, error: deleteError.message };
  const { error: platformError } = await db.from("idea_platforms").insert(input.targetPlatforms.map((platform) => ({ idea_id: row.id, platform })));
  if (platformError) return { data: null, error: platformError.message };
  return mapRow(data as IdeaRow);
}

export function platformOptions(): string[] { return [...SOSMED_PLATFORMS]; }
