import type { DealHandover } from "@/types/deal";

/** Data mock deal handover (US-015). HDV-001 menunggu konfirmasi PM. */
export const mockDeals: DealHandover[] = [
  {
    id: "HDV-001",
    title: "Website Company Profile",
    code: "PYT-2026-001",
    clientId: "KLI-001",
    scope: "Pembuatan website company profile + katalog produk untuk PT Sinar Abadi Properti.",
    features: [
      { name: "Landing page", description: "Hero, layanan, galeri, kontak." },
      { name: "Katalog produk", description: "20 halaman + filter kategori + PDF." },
      { name: "Form kontak WA", description: "Tombol WhatsApp + notifikasi email." },
    ],
    objective: "Menaikkan inquiry online 30% dalam 3 bulan setelah rilis.",
    value: 45000000,
    termScheme: "50-30-20 (DP, serah terima desain, go-live)",
    deadline: "2026-12-20",
    notes: "Logo dan foto dari klien paling lambat 20 Oktober.",
    status: "Menunggu Konfirmasi Produksi",
    versions: [
      {
        version: 1,
        value: 45000000,
        deadline: "2026-12-20",
        note: "Versi awal saat handover dibuat.",
        createdAt: "2026-10-03T05:00:00Z",
      },
    ],
    createdAt: "2026-10-03T05:00:00Z",
    updatedAt: "2026-10-03T05:00:00Z",
  },
  {
    id: "HDV-002",
    title: "Sistem Informasi Yayasan",
    code: "PYT-2026-002",
    clientId: "KLI-002",
    scope: "Sistem data donatur dan laporan kegiatan yayasan.",
    features: [{ name: "Dashboard donatur", description: "CRUD + riwayat donasi." }],
    objective: "Merapikan administrasi dalam 2 bulan.",
    value: 30000000,
    termScheme: "50-50 (DP, serah terima)",
    deadline: "2026-11-30",
    notes: "",
    status: "Draft",
    versions: [
      {
        version: 1,
        value: 30000000,
        deadline: "2026-11-30",
        note: "Versi awal saat handover dibuat.",
        createdAt: "2026-10-01T04:00:00Z",
      },
    ],
    createdAt: "2026-10-01T04:00:00Z",
    updatedAt: "2026-10-01T04:00:00Z",
  },
];
