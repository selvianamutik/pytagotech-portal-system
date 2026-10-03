# API.md — Dokumentasi Endpoint API

> **Status:** Draft Awal (Fase 0)  
> File ini akan diisi secara bertahap selama Fase 1 (Frontend — kontrak data/mock) dan dilengkapi di Fase 2 (Backend — implementasi nyata).

---

## Konvensi

- **Base URL:** `https://your-project.supabase.co` (via Supabase JS Client)
- **Autentikasi:** Bearer token (Supabase Auth JWT) di header `Authorization`
- **Format:** JSON
- **Zona waktu:** Semua timestamp UTC ISO 8601; konversi ke WIB di client/server
- **Paginasi:** query param `?page=1&limit=20` (server-side)
- **Error format:**
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Pesan error yang dapat ditampilkan ke user",
      "details": {}
    }
  }
  ```

---

## Modul: Dashboard / Fondasi (US-001) — Kontrak Data

> **Status:** Draft Fase 1 — diimplementasikan via mock di `frontend/src/mocks/dashboard.ts`,
> diakses lewat `frontend/src/services/dashboard.ts`, tipe di `frontend/src/types/dashboard.ts`.
> Saat Fase 2 (backend), mock diganti query Supabase tanpa mengubah komponen UI.

### `getDashboardSnapshot(): Promise<ServiceResult<DashboardSnapshot>>`

Mengembalikan ringkasan lintas modul untuk beranda dashboard.

```ts
type PortalModule = "Beranda" | "CRM" | "Klien & Handover" | "Proyek" | "Sosmed" | "Pengaturan";
type StatusTone = "success" | "warning" | "critical" | "info" | "priority";

interface NavigationItem { label: string; module: PortalModule; href: string; badge?: number; roles: string[]; }
interface DashboardMetric { label: string; value: string; change: string; tone: StatusTone; }
interface WorkQueueItem { id: string; title: string; module: PortalModule; owner: string; status: string; dueDate: string; tone: StatusTone; }
interface ActivityItem { id: string; actor: string; action: string; subject: string; timestamp: string; module: PortalModule; }

interface DashboardSnapshot {
  currentUser: { name: string; email: string; roles: string[]; };
  metrics: DashboardMetric[];
  navigation: NavigationItem[];
  workQueue: WorkQueueItem[];
  activities: ActivityItem[];
}
```

- **Timestamp:** string ISO 8601 UTC (contoh: `2026-10-04T08:30:00Z`); dikonversi ke WIB (`Asia/Jakarta`) di tampilan via `formatDateTime`.
- **Error:** `{ data: null, error: string }` — halaman menampilkan kartu "Dashboard belum tersedia".

---

## Modul: Auth (via Supabase Auth)

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/auth/v1/token?grant_type=password` | Login email+password | Public |
| POST | `/auth/v1/logout` | Logout | Authenticated |
| POST | `/auth/v1/recover` | Reset password | Public |

---

## Modul: Users & Roles

> _Akan didokumentasikan saat US-002 dimulai_

---

## Modul: Master Data

> _Akan didokumentasikan saat US-005 dimulai_

---

## Modul: CRM — Leads

> _Akan didokumentasikan saat US-007 dimulai_

---

## Modul: CRM — Interested Leads (Pipeline)

> _Akan didokumentasikan saat US-011 dimulai_

---

## Modul: Klien

> _Akan didokumentasikan saat US-014 dimulai_

---

## Modul: Deal Handover

> _Akan didokumentasikan saat US-015 dimulai_

---

## Modul: Proyek

> _Akan didokumentasikan saat US-019 dimulai_

---

## Modul: Task

> _Akan didokumentasikan saat US-022 dimulai_

---

## Modul: Fitur (Backlog)

> _Akan didokumentasikan saat US-023 dimulai_

---

## Modul: Content Planner

> _Akan didokumentasikan saat US-027 dimulai_

---

## Modul: Content Materials

> _Akan didokumentasikan saat US-028 dimulai_

---

## Modul: Publications

> _Akan didokumentasikan saat US-031 dimulai_

---

## Modul: Analytics

> _Akan didokumentasikan saat US-035 dimulai_

---

## Modul: Community & Inquiry

> _Akan didokumentasikan saat US-037 dimulai_

---

## Modul: Assets

> _Akan didokumentasikan saat US-034 dimulai_

---

## Modul: Audit Log

> _Akan didokumentasikan saat US-004 dimulai_

---

## Modul: Komentar & Lampiran

> _Akan didokumentasikan saat US-006 dimulai_

---

## Modul: Notifikasi

> _Akan didokumentasikan saat US-006 dimulai_

---

## Modul: Pengaturan

> _Akan didokumentasikan saat US-041 dimulai_
