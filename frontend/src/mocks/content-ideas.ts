import type { ContentIdea } from "@/types/content-idea";

/** Data mock ide konten (US-027). */
export const mockIdeas: ContentIdea[] = [
  {
    id: "IDE-001",
    title: "5 Kesalahan API Pemula",
    brand: "Pytagotech",
    pillar: "Edukasi",
    funnel: "Awareness",
    targetPlatforms: ["Instagram", "TikTok"],
    brief: {
      hook: "90% API bocor karena 5 hal sepele ini.",
      angle: "Edukasi + takut ketinggalan.",
      keyPoints: "Validasi, rate limit, secret, versioning, docs.",
      cta: "Follow untuk part 2.",
      assetRef: "AST-001",
    },
    readiness: "Disetujui",
    createdAt: "2026-10-01T02:00:00Z",
  },
  {
    id: "IDE-002",
    title: "Cerita Klien Aruna",
    brand: "Pytagotech",
    pillar: "Testimoni",
    funnel: "Conversion",
    targetPlatforms: ["Instagram"],
    brief: {
      hook: "",
      angle: "Studi kasus.",
      keyPoints: "",
      cta: "",
      assetRef: "",
    },
    readiness: "Tahan - Perlu Verifikasi",
    createdAt: "2026-10-03T02:00:00Z",
  },
];
