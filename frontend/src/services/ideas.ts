import { mockIdeas } from "@/mocks/content-ideas";
import type { ContentIdea, IdeaInput } from "@/types/content-idea";
import { briefScore, isIdeaFunnel, isIdeaReadiness } from "@/types/content-idea";
import { isSosmedBrand, isSosmedPlatform, SOSMED_PLATFORMS } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Content Planner (US-027, FR-21). Fase 1: mock in-memory.
 * Ambang Siap Masuk Produksi = 5/5 (Q-003 A) ditegakkan di sini.
 */

let ideaStore: ContentIdea[] = structuredClone(mockIdeas);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockIdeas(): void {
  ideaStore = structuredClone(mockIdeas);
}

function validateIdeaInput(input: IdeaInput): string | null {
  if (input.title.trim().length === 0) {
    return "Judul ide wajib diisi.";
  }
  if (!isSosmedBrand(input.brand)) {
    return "Lini bisnis tidak dikenal.";
  }
  if (input.pillar.trim().length === 0) {
    return "Pillar wajib diisi.";
  }
  if (!isIdeaFunnel(input.funnel)) {
    return "Funnel harus Awareness, Consideration, atau Conversion.";
  }
  if (input.targetPlatforms.length === 0) {
    return "Pilih minimal satu platform target.";
  }
  for (const platform of input.targetPlatforms) {
    if (!isSosmedPlatform(platform)) {
      return `Platform tidak dikenal: ${platform}.`;
    }
  }
  if (!isIdeaReadiness(input.readiness)) {
    return "Status kelayakan tidak dikenal.";
  }
  return null;
}

/** Ambang Siap Masuk Produksi: skor 5/5 (Q-003 A). */
export function readinessAllowed(readiness: string, score: number): string | null {
  if (readiness === "Siap Masuk Produksi" && score < 5) {
    return `Skor brief ${score}/5 — "Siap Masuk Produksi" mensyaratkan 5/5.`;
  }
  return null;
}

export async function listIdeas(): Promise<ServiceResult<ContentIdea[]>> {
  return {
    data: [...ideaStore]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((idea) => ({
        ...idea,
        targetPlatforms: [...idea.targetPlatforms],
        brief: { ...idea.brief },
      })),
    error: null,
  };
}

export async function getIdea(ideaId: string): Promise<ServiceResult<ContentIdea>> {
  const idea = ideaStore.find((item) => item.id === ideaId);
  if (!idea) {
    return { data: null, error: "Ide tidak ditemukan." };
  }
  return {
    data: { ...idea, targetPlatforms: [...idea.targetPlatforms], brief: { ...idea.brief } },
    error: null,
  };
}

export async function createIdea(input: IdeaInput): Promise<ServiceResult<ContentIdea>> {
  const validationError =
    validateIdeaInput(input) ?? readinessAllowed(input.readiness, briefScore(input.brief));
  if (validationError) {
    return { data: null, error: validationError };
  }
  const idea: ContentIdea = {
    id: `IDE-${String(ideaStore.length + 1).padStart(3, "0")}`,
    title: input.title.trim(),
    brand: input.brand as ContentIdea["brand"],
    pillar: input.pillar.trim(),
    funnel: input.funnel as ContentIdea["funnel"],
    targetPlatforms: [...input.targetPlatforms],
    brief: {
      hook: input.brief.hook.trim(),
      angle: input.brief.angle.trim(),
      keyPoints: input.brief.keyPoints.trim(),
      cta: input.brief.cta.trim(),
      assetRef: input.brief.assetRef.trim(),
    },
    readiness: input.readiness as ContentIdea["readiness"],
    createdAt: new Date().toISOString(),
  };
  ideaStore.push(idea);
  return { data: { ...idea }, error: null };
}

export async function updateIdea(
  ideaId: string,
  input: IdeaInput
): Promise<ServiceResult<ContentIdea>> {
  const idea = ideaStore.find((item) => item.id === ideaId);
  if (!idea) {
    return { data: null, error: "Ide tidak ditemukan." };
  }
  const validationError =
    validateIdeaInput(input) ?? readinessAllowed(input.readiness, briefScore(input.brief));
  if (validationError) {
    return { data: null, error: validationError };
  }
  idea.title = input.title.trim();
  idea.brand = input.brand as ContentIdea["brand"];
  idea.pillar = input.pillar.trim();
  idea.funnel = input.funnel as ContentIdea["funnel"];
  idea.targetPlatforms = [...input.targetPlatforms];
  idea.brief = {
    hook: input.brief.hook.trim(),
    angle: input.brief.angle.trim(),
    keyPoints: input.brief.keyPoints.trim(),
    cta: input.brief.cta.trim(),
    assetRef: input.brief.assetRef.trim(),
  };
  idea.readiness = input.readiness as ContentIdea["readiness"];
  return {
    data: { ...idea, targetPlatforms: [...idea.targetPlatforms], brief: { ...idea.brief } },
    error: null,
  };
}

export function platformOptions(): string[] {
  return [...SOSMED_PLATFORMS];
}
