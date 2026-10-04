import type { Guide, RaciRow } from "@/types/guide";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan panduan SOP & RACI (US-042). Panduan markdown dapat
 * disunting Admin; matriks RACI per aktivitas × role.
 */

let guideStore: Guide[] = [];

let raciStore: RaciRow[] = [];

function seedGuides(): Guide[] {
  return [
    {
      slug: "panduan-crm",
      title: "Panduan CRM & Lead",
      content: [
        "# Panduan CRM & Lead",
        "",
        "Alur inti modul CRM: **Database Lead** → **Pipeline** → **Closing**.",
        "",
        "## Aturan penting",
        "",
        "- Status Interest otomatis masuk pipeline Interested Leads.",
        "- Lead Closing dijadikan klien tanpa input ulang.",
        "- Periksa peringatan duplikat sebelum menyimpan.",
        "",
        "Lihat juga [Database Lead](/crm/leads).",
      ].join("\n"),
      updatedAt: "2026-10-01T02:00:00Z",
    },
    {
      slug: "panduan-handover",
      title: "Panduan Deal Handover",
      content: [
        "# Panduan Deal Handover",
        "",
        "Handover mengalir **Draft → Menunggu → Dikonfirmasi / Perlu Revisi**.",
        "",
        "## Checklist Sales",
        "",
        "- Total termin sama dengan nilai deal.",
        "- Fitur dilengkapi penjelasan output.",
        "- Ajukan ke Produksi setelah termin seimbang.",
      ].join("\n"),
      updatedAt: "2026-10-02T02:00:00Z",
    },
  ];
}

function seedRaci(): RaciRow[] {
  return [
    {
      activity: "Input & kelola lead",
      assignments: {
        "Sales / Marketing": "R",
        "Project Manager": "",
        Developer: "",
        "Social Media Specialist": "",
        Designer: "",
        Leader: "A",
        "Super Admin": "",
      },
    },
    {
      activity: "Konfirmasi deal handover",
      assignments: {
        "Sales / Marketing": "C",
        "Project Manager": "R",
        Developer: "",
        "Social Media Specialist": "",
        Designer: "",
        Leader: "A",
        "Super Admin": "",
      },
    },
    {
      activity: "Review & rilis konten",
      assignments: {
        "Sales / Marketing": "",
        "Project Manager": "",
        Developer: "",
        "Social Media Specialist": "R",
        "Designer": "C",
        Leader: "A",
        "Super Admin": "",
      },
    },
  ];
}

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockGuides(): void {
  guideStore = seedGuides();
  raciStore = seedRaci();
}

resetMockGuides();

export async function listGuides(): Promise<ServiceResult<Guide[]>> {
  return { data: guideStore.map((guide) => ({ ...guide })), error: null };
}

export async function updateGuide(
  slug: string,
  content: string
): Promise<ServiceResult<Guide>> {
  const guide = guideStore.find((item) => item.slug === slug);
  if (!guide) {
    return { data: null, error: "Panduan tidak ditemukan." };
  }
  if (!content.trim()) {
    return { data: null, error: "Isi panduan tidak boleh kosong." };
  }
  guide.content = content;
  guide.updatedAt = new Date().toISOString();
  return { data: { ...guide }, error: null };
}

export async function listRaci(): Promise<ServiceResult<RaciRow[]>> {
  return {
    data: raciStore.map((row) => ({ activity: row.activity, assignments: { ...row.assignments } })),
    error: null,
  };
}

export async function setRaciCell(
  activity: string,
  role: string,
  value: string
): Promise<ServiceResult<RaciRow>> {
  const row = raciStore.find((item) => item.activity === activity);
  if (!row) {
    return { data: null, error: "Aktivitas tidak ditemukan." };
  }
  if (!(role in row.assignments)) {
    return { data: null, error: "Role tidak dikenal." };
  }
  if (value !== "" && !["R", "A", "C", "I"].includes(value)) {
    return { data: null, error: "Nilai harus R, A, C, I, atau kosong." };
  }
  row.assignments[role] = value as "R" | "A" | "C" | "I" | "";
  return { data: { activity: row.activity, assignments: { ...row.assignments } }, error: null };
}
