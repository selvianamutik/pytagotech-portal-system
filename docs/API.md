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

> **Status:** Draft Fase 1 (US-002) — mock di `frontend/src/mocks/auth.ts`,
> diakses via `frontend/src/services/auth.ts`, tipe di `frontend/src/types/auth.ts`,
> state sesi di `frontend/src/store/auth.ts` (Zustand).
> Fase 2: login/logout/reset diganti Supabase Auth; CRUD user memakai tabel
> `profiles` + `user_roles` dengan RLS (US-003).

### Auth

| Fungsi service | Setara Supabase (Fase 2) | Deskripsi |
|----------------|--------------------------|-----------|
| `login({email, password}) → AuthSession` | `signInWithPassword` | Validasi format email + password min 8; pesan error generik |
| `logout() → true` | `signOut` | Menghapus sesi |
| `requestPasswordReset(email) → string` | `resetPasswordForEmail` | Pesan tautan reset (mock) |
| `getSession() → AuthSession \| null` | `getSession` + middleware | Sumber state `store/auth` |

### Manajemen user (khusus Super Admin, halaman `/pengaturan/pengguna`)

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listUsers() → PortalUser[]` | Termasuk user nonaktif (dengan badge) |
| `createUser({name, email, roles}) → PortalUser` | Email unik; minimal 1 role valid dari `PORTAL_ROLES` |
| `updateUserRoles(id, roles)` | Minimal 1 role; Super Admin terakhir yang aktif tidak bisa dicabut |
| `setUserActive(id, active, actorId?)` | Tidak bisa menonaktifkan akun sendiri; tidak bisa menonaktifkan Super Admin terakhir |

```ts
type UserRole = "Super Admin" | "Executive / Leader" | "Sales / Marketing"
  | "Project Manager" | "Developer" | "Social Media Specialist"
  | "Graphic Designer / Video Editor / Copywriter";

interface PortalUser { id: string; name: string; email: string; roles: UserRole[]; isActive: boolean; createdAt: string; }
interface AuthSession { user: PortalUser; expiresAt: string; }
```

Halaman tanpa izin menampilkan konten 403 (`/403`, komponen `RequireRole`), bukan data kosong.

---

## Modul: Master Data

> _Akan didokumentasikan saat US-005 dimulai_

---

## Modul: CRM — Leads

> **Status:** Draft Fase 1 (US-007) — mock di `frontend/src/mocks/leads.ts`,
> diakses via `frontend/src/services/leads.ts`, tipe di `frontend/src/types/lead.ts`.
> Halaman `/crm/leads` (tabel + form tambah/ubah). Validator format bersama di
> `frontend/src/lib/validators.ts` (dipakai ulang service auth).
> Fase 2: tabel `leads` + trigger display ID `LEAD-xxx` + unique index WhatsApp.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listLeads()` | Terurut tanggal hubungi terbaru |
| `getLead(id)` | Error jika tidak dikenal |
| `createLead(input)` | Field wajib: perusahaan, industri (`INDUSTRY_CATEGORIES`), WhatsApp, email, PIC, status, tanggal; Instagram opsional (`@nama`); **peringatan duplikat non-blokir** via WhatsApp ternormalisasi atau nama perusahaan |
| `updateLead(id, partial)` | Validasi ulang field yang diubah; duplikat mengecualikan diri sendiri |
| `findDuplicates(whatsapp, companyName, excludeId?)` | Deteksi FR-7 |
| `listLeadPICs()` | User aktif (dropdown PIC) |
| `queryLeads(query)` (US-008) | Pencarian teks (perusahaan/email/WA/IG) + filter status/PIC/industri/rentang tanggal + sort (`companyName`/`contactDate`/`status`/`picName`) + paginasi (`page`, `limit` default 5) → `{items, total, page, limit, pageCount}` |
| `assignLeadPIC(ids, picName, actor)` (US-009) | Assign/reassign satuan & massal; tiap perubahan PIC dicatat ke audit trail (`lead.assign-pic`, pratinjau US-004) |
| `previewLeadImport(csv)` / `importLeads(preview, {skipDuplicates})` (US-010) | Template header `companyName,industry,contactDate,whatsapp,instagram,email,picName,status`; preview tandai valid/tidak-valid/duplikat (vs data + dalam file); impor lewati duplikat bila diminta |

```ts
type LeadStatus = "New" | "Contacted" | "Follow Up" | "Interest" | "Not Interested" | "Lost" | "Closing";
interface Lead { id: string; contactDate: string; companyName: string; industry: IndustryCategory; whatsapp: string; instagram: string; email: string; picName: string; status: LeadStatus; createdAt: string; updatedAt: string; }
```

---

## Modul: CRM — Interested Leads (Pipeline)

> **Status:** Draft Fase 1 (US-011) — `services/interest.ts`, tipe `types/interest.ts`.
> Halaman `/crm/interested` (Kanban drag-and-drop + tabel).
> Fase 2: tabel `lead_interests`; Closing pipeline → klien + handover (US-014).

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `getPipeline()` | Otomatis berisi lead berstatus Interest + tahap/kebutuhan; tahap awal `New Interest` |
| `moveInterestStage(leadId, stage, actor)` | Hanya untuk lead Interest; dicatat audit `lead.move-stage` |
| `updateInterestNeed(leadId, need)` | Kebutuhan/solusi yang dicari klien |

```ts
type InterestStage = "New Interest" | "Contacted" | "Demo" | "Price Sent" | "Negotiation" | "Closing" | "Lost";
```

---

## Modul: CRM — Activity Log

> **Status:** Draft Fase 1 (US-012) — catatan di `services/lead-activities.ts`;
> perubahan otomatis (status/tahap/PIC/follow-up) dibaca dari audit trail.
> Dialog aktivitas per baris lead di `/crm/leads`.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listLeadNotes(leadId)` / `addLeadNote(leadId, authorId, body)` | Catatan maks 2000 karakter |
| `getLeadTimeline(leadId)` | Gabungan catatan + perubahan, terbaru dulu, dengan penulis & waktu |
| `setNextFollowUp(leadId, date, actor)` (di `services/leads`) | Audit `lead.followup` |
| `isFollowUpOverdue(nextFollowUp, status)` | Overdue bila lewat hari ini dan status belum final (Closing/Lost/Not Interested dikecualikan) |

---

## Modul: CRM — Dashboard

> **Status:** Draft Fase 1 (US-013) — `services/crm-dashboard.ts`.
> Halaman `/crm/dashboard` (KPI + kinerja per PIC + filter periode).
> Fase 2: agregasi SQL; rumus tetap didokumentasikan di tooltip.

| Fungsi | Definisi |
|--------|----------|
| Total Database Lead | Seluruh lead (semua waktu) |
| Total Outreach | Lead dengan tanggal hubungi dalam periode |
| Interest Rate | `Interested ÷ Outreach × 100%` (tertulis di tooltip) |
| Closing Rate | `Closing ÷ Outreach × 100%` (tertulis di tooltip) |
| Kinerja per PIC | Ditangani, contacted, follow up, interest, not interested, lost, closing |

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

> **Status:** Draft Fase 1 (US-006) — mock di `frontend/src/mocks/collaboration.ts`,
> diakses via `frontend/src/services/collaboration.ts`, tipe di
> `frontend/src/types/collaboration.ts`. Komponen reusable di
> `frontend/src/components/collaboration/` (satu komponen untuk lead, task,
> fitur, konten — cukup ganti `entityType` + `entityId`).
> Fase 2: komentar → tabel `comments`; lampiran → Supabase Storage + tabel
> `attachments`; mention resolution → tabel user nyata.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listComments(entityType, entityId)` | Filter per entitas |
| `addComment({entityType, entityId, authorId, body})` | Body wajib isi, maks 2000 karakter; token `@Nama` (nama depan/lengkap, case-insensitive) otomatis membuat notifikasi mention |
| `listAttachments(entityType, entityId)` | Filter per entitas |
| `uploadAttachment({... fileName, fileSizeBytes, mimeType})` | Batas dari `NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES` (default 10MB); error jelas jika melebihi |
| `deleteAttachment(id)` | Error jika id tidak dikenal |

```ts
type CollaborableEntityType = "lead" | "task" | "fitur" | "konten";
interface CommentItem { id: string; entityType: CollaborableEntityType; entityId: string; authorId: string; authorName: string; body: string; mentionedUserIds: string[]; createdAt: string; }
interface AttachmentItem { id: string; entityType: CollaborableEntityType; entityId: string; fileName: string; fileSizeBytes: number; mimeType: string; url: string; uploadedById: string; uploadedByName: string; createdAt: string; }
```

---

## Modul: Notifikasi

> **Status:** Draft Fase 1 (US-006) — mock + `store/notifications.ts` (Zustand)
> untuk badge bell di header. Halaman `/notifikasi` (daftar, filter, tandai
> dibaca). Galeri verifikasi: `/demo/kolaborasi`.
> Fase 2: diganti Supabase Realtime + tabel `notifications`.

| Fungsi service | Deskripsi |
|----------------|-----------|
| `listNotifications()` | Terurut terbaru; tipe `assignment` \| `mention` \| `status` |
| `getUnreadNotificationCount()` | Sumber badge bell |
| `markNotificationRead(id)` / `markAllNotificationsRead()` | Tandai dibaca |

```ts
type NotificationType = "assignment" | "mention" | "status";
interface NotificationItem { id: string; type: NotificationType; title: string; message: string; entityType?: CollaborableEntityType; entityId?: string; actorName?: string; isRead: boolean; createdAt: string; }
```

---

## Modul: Pengaturan

> _Akan didokumentasikan saat US-041 dimulai_
