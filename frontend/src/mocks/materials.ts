import type { ContentMaterial } from "@/types/material";

/** Data mock materi (US-028). MAT-0018 merujuk IDE-001 yang Disetujui. */
export const mockMaterials: ContentMaterial[] = [
  {
    id: "MAT-0018",
    title: "Carousel 5 Kesalahan API",
    brand: "Pytagotech",
    status: "Draf",
    draftLink: "https://drive.test/draf-mat0018",
    copywriter: "Alya",
    designer: "Nabila",
    videoEditor: "",
    ideaId: "IDE-001",
    qualityGate: {
      "rasio visual": true,
      "lisensi audio": true,
      "brand cover": false,
      "link bio/CTA": false,
      "proofread copy": false,
    },
    createdAt: "2026-10-03T02:00:00Z",
  },
];
