import type { Asset } from "@/types/asset";

/** Data mock aset (US-034): satu hampir kedaluwarsa, satu sudah lewat. */
export const mockAssets: Asset[] = [
  {
    id: "AST-001",
    name: "Logo pack Pytagotech",
    fileType: "Figma",
    cloudLink: "https://drive.test/logo-pack",
    owner: "internal",
    licenseType: "Internal",
    createdAt: "2026-09-01T02:00:00Z",
  },
  {
    id: "AST-002",
    name: "Musik backsound v2",
    fileType: "MP3",
    cloudLink: "https://drive.test/bgm-v2",
    owner: "partner",
    licenseType: "Lisensi tahunan",
    licenseExpiry: "2026-10-20",
    createdAt: "2026-09-10T02:00:00Z",
  },
  {
    id: "AST-003",
    name: "Footage kantor lama",
    fileType: "MP4",
    cloudLink: "https://drive.test/footage-lama",
    owner: "klien",
    licenseType: "Lisensi proyek",
    licenseExpiry: "2026-09-01",
    createdAt: "2026-08-01T02:00:00Z",
  },
];
