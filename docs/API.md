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

> **Status:** Backend Fase 3 (US-002 + FR-1) — `services/auth.ts` memakai
> Supabase Auth + tabel `profiles`/`user_roles` (RLS US-003); signature service
> tidak berubah sehingga komponen UI (`login-form`, `user-management`,
> `RequireRole`, `store/auth`) tidak disentuh kecuali teks bantuan.
> Proxy (`src/proxy.ts`): tamu → `/login`; user login di `/login` → `/`.

### Auth

| Fungsi service | Implementasi backend | Deskripsi |
|----------------|----------------------|-----------|
| `login({email, password}) → AuthSession` | `signInWithPassword` + baca `profiles`/`user_roles` | Validasi format email + password min 8; pesan error generik; tolak akun nonaktif (sesi langsung di-sign-out) |
| `logout() → true` | `signOut` | Menghapus sesi |
| `requestPasswordReset(email) → string` | `resetPasswordForEmail` (`redirectTo: <APP_URL>/auth/confirm?next=/login?recovery=1`) | Selalu sukses agar tidak membocorkan email terdaftar |
| `updatePassword(password) → true` | `updateUser` (sesi recovery) | Mode "password baru" di `/login?recovery=1`; min 8 karakter |
| `getSession() → AuthSession \| null` | `getSession` + profil/role | Sumber state `store/auth`; gagal baca = belum masuk |

### Alur email Auth (template di `frontend/supabase/templates/`)

Paste ke Dashboard → Authentication → Email Templates (panduan di
`frontend/supabase/templates/README.md`): `confirmation.html` (signup),
`email_change.html` (ganti email), `recovery.html` (reset password).
Semua tautan mendarat di `GET /auth/confirm` (tukar `code`/`token_hash` →
sesi, dukung PKCE + OTP; `next` tervalidasi path internal) lalu:
signup/ganti-email → `/`; recovery → `/login?recovery=1` (form password baru,
proxy mengizinkan sesi recovery di `/login`). Tautan basi/gagal →
`/auth/error?reason=tautan-kedaluwarsa` (halaman error khusus, terpisah dari
form login).

### Manajemen user (khusus Super Admin, halaman `/pengaturan/pengguna`)

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listUsers() → PortalUser[]` | Dari `profiles` + `user_roles`, urut nama; termasuk nonaktif (badge) |
| `createUser({name, email, roles}) → PortalUser` | Via `POST /api/admin/users` (service_role, tak pernah ke browser); email unik; minimal 1 role valid; user langsung aktif — atur kata sandi via Lupa kata sandi |
| `updateUserRoles(id, roles)` | Minimal 1 role; Super Admin terakhir yang aktif tidak bisa dicabut (dicek via query) |
| `setUserActive(id, active, actorId?)` | Tidak bisa menonaktifkan akun sendiri; tidak bisa menonaktifkan Super Admin terakhir |

### `POST /api/admin/users`

Membuat akun Auth terkonfirmasi (password acak) + profil (trigger `handle_new_user`, nama diselaraskan) + role awal. Rollback (hapus akun Auth) bila insert role gagal.

- **Auth:** cookie sesi; penelepon wajib Super Admin (dicek dari role milik sendiri) → 401/403.
- **Butuh env server:** `SUPABASE_SERVICE_ROLE_KEY` (dari Dashboard → Settings → API; tanpa ini → 500) — berlaku juga untuk user Super Admin pertama: buat via Dashboard → Auth → Users, lalu `INSERT INTO user_roles` + tautkan `team_members.profile_id` via SQL.
- **Request:** `{ name: string, email: string, roles: UserRole[] }`
- **Response:** `201 { data: PortalUser }` · `400 validasi` · `401/403 otorisasi` · `409 email ganda` · `500 konfigurasi/gagal` → `{ error: string }`.

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

> **Status:** Backend Fase 3 (US-005, FR-3) — baca/tulis langsung ke Supabase
> via `frontend/src/services/master-data.ts`; tipe di
> `frontend/src/types/master-data.ts`; halaman `/pengaturan/master-data`
> (Super Admin). Form memakai hook `useMasterOptions` agar opsi aktif selalu
> berasal dari database.
>
> Tabel: `master_options(category, value, is_active)` untuk 8 kelompok dropdown;
> `team_members(id, profile_id, name, status)` untuk tim/PIC.
> RLS: user terautentikasi hanya melihat opsi aktif; Super Admin boleh melihat
> nonaktif dan satu-satunya yang boleh menulis.

| Kelompok UI | `master_options.category` / tabel | Dipakai di |
|-------------|-----------------------------------|------------|
| Kategori industri | `industry` | Form lead, filter CRM |
| Status lead | `lead_status` | Form lead, filter, dialog aktivitas |
| Tahapan interest | `interest_stage` | Pipeline Interested Leads |
| Lini bisnis | `brand` | Content planner, materi, kalender, inquiry, KIST, scorecard |
| Platform | `platform` | Ide, materi, distribusi, kalender, pertumbuhan, komunitas, inquiry |
| Pillar konten | `pillar` | Content planner, evaluasi KIST |
| Kategori fitur | `feature_category` | Backlog fitur proyek |
| Prioritas | `priority` | Backlog fitur proyek |
| Tim / PIC | `team_members` | Dropdown PIC lead, inquiry, penugasan |

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listMasterOptions({includeInactive?})` | Urut kategori + nilai; filter `is_active` kecuali admin meminta semua |
| `getActiveMasterOptions()` | Dikelompokkan per kategori untuk dropdown; bila tabel kosong, memakai daftar cadangan konstanta |
| `createMasterOption({category, value, isActive?})` | Kategori harus terdaftar; nilai trim 1–80 karakter; duplikat per kategori ditolak |
| `updateMasterOption(category, currentValue, {value, isActive?})` | Rename ditolak bila opsi sedang dipakai (FK komposit tanpa ON UPDATE CASCADE); status aktif bisa diubah |
| `setMasterOptionActive(category, value, isActive)` | Nonaktifkan/aktifkan tanpa menghapus; opsi nonaktif hilang dari form user biasa |
| `deleteMasterOption(category, value)` | Hanya opsi tanpa referensi; opsi terpakai → pesan untuk menonaktifkan; DELETE 0 baris → error, bukan sukses |
| `listTeamMembers()` | Semua anggota tim/PIC, urut nama |
| `createTeamMember({name, status})` / `updateTeamMember(id, input)` | Nama unik 1–100 karakter; status `internal`/`external` |
| `deleteTeamMember(id)` | Ditolak bila direferensikan lead, proyek, task, fitur, materi, komentar, dsb. (Q-015); DELETE 0 baris → error |
| Hook `useMasterOptions()` | Mengambil opsi aktif sekali saat komponen dipasang; fallback ke konstanta bila database belum bisa dibaca |

```ts
type MasterOptionCategory = "industry" | "lead_status" | "interest_stage"
  | "brand" | "platform" | "pillar" | "feature_category" | "priority";

interface MasterOption { category: MasterOptionCategory; value: string; isActive: boolean; }
interface TeamMember { id: string; profileId: string | null; name: string; status: "internal" | "external"; createdAt: string; updatedAt: string; }
```

**Catatan tim/PIC:** skema `team_members` yang disetujui belum memiliki kolom
`is_active`, sehingga belum ada tombol nonaktifkan. Penghapusan dijaga dengan
cek referensi; keputusan penambahan kolom aktif menunggu Q-015.

**Catatan DELETE:** Supabase/PostgREST mengembalikan `200` + array kosong bila
RLS menyaring semua baris DELETE, bukan error. Service kini memakai
`.delete().select(...)` dan menganggap 0 baris sebagai kegagalan agar UI tidak
menampilkan sukses palsu. Di database live saat ini DELETE `master_options`
oleh role `authenticated` masih 0 baris (Q-016); INSERT/PATCH dan DELETE
`team_members` berfungsi. Cek referensi tim/PIC dijalankan paralel agar hapus
tidak menunggu 19 query berurutan.

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

> **Status:** Draft Fase 1 (US-014) — mock di `frontend/src/mocks/clients.ts`,
> diakses via `frontend/src/services/clients.ts`, tipe di `frontend/src/types/client.ts`.
> Halaman `/klien`. Fase 2: tabel `clients` + relasi 1-N ke `deals`/`projects`.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listClients()` / `getClient(id)` | Terurut nama perusahaan |
| `createClient(input)` / `updateClient(id, partial)` | Validasi WA/email; peringatan bila perusahaan sudah terdaftar |
| `listConvertibleLeads()` | Lead Closing yang belum menjadi klien |
| `createClientFromLead(leadId, {picName, referrer})` (FR-9) | Hanya dari lead Closing; data terisi otomatis, anti konversi ganda |

```ts
interface Client { id: string; companyName: string; picName: string; phone: string; email: string; referrer: string; sourceLeadId?: string; createdAt: string; updatedAt: string; }
```

---

## Modul: Deal Handover

> **Status:** Draft Fase 1 (US-015) — mock di `frontend/src/mocks/deals.ts`,
> diakses via `frontend/src/services/deals.ts`, tipe di `frontend/src/types/deal.ts`.
> Halaman `/handover` (tabel + form + panel panduan interim, Q-012 menunggu SOP resmi).
> Fase 2: tabel `deals` + trigger nama/kode.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listDeals()` / `getDeal(id)` | Mengembalikan `displayName` terformat FR-11 + nama klien |
| `createDeal(input)` | Semua field wajib + minimal 1 fitur berpenjelasan; kode unik; status awal Draft + versi 1 |
| `updateDeal(id, partial)` | Draft/Revisi bisa diubah; Dikonfirmasi terkunci (via change request, US-018) |

```ts
interface DealHandover { id: string; title: string; code: string; clientId: string; scope: string; features: { name: string; description: string }[]; objective: string; value: number; termScheme: string; deadline: string; notes: string; status: HandoverStatus; versions: DealVersion[]; createdAt: string; updatedAt: string; }
```

---

## Modul: Termin Pembayaran

> **Status:** Draft Fase 1 (US-016) — mock di `frontend/src/mocks/deal-terms.ts`,
> diakses via `frontend/src/services/deal-terms.ts`. Editor di halaman detail
> `/handover/[id]`. Fase 2: tabel `deal_payment_terms`.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listTerms(dealId)` | Termin + `{totalAmount, dealValue, balanced}` |
| `replaceTerms(dealId, inputs)` (FR-12) | Simpan set: tiap baris wajib nama + nilai + tempo (tanggal/milestone); **total wajib = nilai deal** — ditolak dengan pesan selisih; status lama dipertahankan per id; terkunci bila Dikonfirmasi |
| `updateTermStatus(termId, status)` | Belum Ditagih / Ditagih / Lunas |

---

## Modul: Change Request

> **Status:** Draft Fase 1 (US-018) — mock di `frontend/src/mocks/change-requests.ts`,
> diakses via `frontend/src/services/change-requests.ts`. Log + riwayat versi
> di halaman detail `/handover/[id]`. Fase 2: tabel `change_requests`.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listChangeRequests(dealId)` | Log per deal |
| `createChangeRequest(dealId, input, author)` | Jenis: negosiasi/penambahan fitur/percepatan waktu/penyesuaian harga; wajib deskripsi + minimal 1 dampak |
| `decideChangeRequest({crId, decision, actor})` (FR-14) | Persetujuan menerapkan dampak ke deal + versi baru + notifikasi; penolakan tanpa perubahan; anti putusan ganda |

---

## Modul: Konfirmasi Handover

> **Status:** Draft Fase 1 (US-017) — `services/deal-workflow.ts`.
> Aksi di halaman detail `/handover/[id]`. Fase 2: RLS putusan PM (US-003).

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `transitionDealStatus({dealId, to, actor, comment?})` (FR-13) | Alur Draft → Menunggu → Dikonfirmasi/Perlu Revisi (↩ ajukan ulang); putusan hanya PM/Super Admin; komentar wajib saat Perlu Revisi; pengajuan mensyaratkan termin seimbang; tiap perubahan → notifikasi + audit |

---

## Modul: Proyek

> **Status:** Draft Fase 1 (US-019) — mock di `services/projects.ts`
> (`mockProjects` kosong; proyek lahir dari handover), tipe `types/project.ts`.
> Halaman detail `/proyek/[id]`; daftar menyusul US-020.
> Fase 2: tabel `projects` (satu PM per proyek, Q-001 A).

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `createProjectFromHandover(handoverId, {pmName, startDate})` (FR-15) | Hanya dari Dikonfirmasi; salin nama/kode/klien/nilai/deadline; 1 handover = 1 proyek; PM dari daftar; mulai ≤ deadline |
| `listProjects()` / `getProject(id)` | Dilengkapi nama klien + kode handover (relasi dua arah) |
| `listProjectManagers()` | PM + Super Admin aktif |
| `queryProjects({search, statuses, pmNames, clientIds})` (US-020) | Pencarian + filter; progress otomatis dari task |
| `updateProject(id, partial)` (US-020) | Status/PM/tanggal; UI hanya untuk PM/Admin |
| `canManageProjects(user)` | Gerbang tombol buat/ubah proyek |

---

## Modul: Task

> **Status:** Draft Fase 1 — store minimal + template (US-020/US-021).
> CRUD penuh, Kanban, sub-task menyusul US-022.
> `services/task-templates.ts`, halaman `/pengaturan/template-task` (Admin).

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listTaskTemplates()` / `createTaskTemplate()` / `updateTaskTemplate()` / `deleteTaskTemplate()` | Nama, urutan ≥1, durasi ≥1 hari; nonaktif dilewati generate |
| `generateTasksForProject(projectId, startDate)` (FR-16) | Task berurutan dari tanggal mulai; dipanggil otomatis saat proyek dibuat |
| `getProjectProgress(projectId)` | Rata-rata task atas yang aktif |
| `setTaskSummaryActive()` / `deleteTaskSummary()` | PM nonaktifkan/hapus hasil generate |
| Task penuh (US-022, FR-17) | `addTaskSummary` (semua field) / `updateTaskSummary` / `moveTaskSummaryStatus` (Kanban) / `effectiveTaskPercent` (induk dari sub-task); komentar + lampiran via US-006 (`entityType: "task"`) |
| Board global (laporan pemilik) | `/proyek/board`: Kanban lintas proyek + cari + seret; `listAllTaskSummaries` |
| Master developer (permintaan pemilik) | CRUD nama + internal/external; dropdown assignee task & fitur (`/pengaturan/developer`, Admin) |

---

## Modul: Penjadwalan Fitur

> **Status:** Draft Fase 1 (US-024) — `services/scheduling.ts`.
> Penjadwalan di halaman detail proyek. Fase 2: kolom jadwal di tabel `features`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| `scheduleProjectFeatures(projectId)` (FR-18) | Prioritas High→Low; durasi = ceil(estimasi × 8/kapasitas); hari kerja Sen–Jumat − libur; berurutan per developer; bentrok ditandai |
| `overrideFeatureSchedule(featureId, {startDate, endDate, reason})` | Alasan wajib; dapat memicu bentrok |
| `getScheduleSettings()` / `setScheduleSettings()` | Hari libur + kapasitas jam/hari per developer |

---

## Modul: Gantt Chart

> **Status:** Draft Fase 1 (US-025) — `services/task-dependencies.ts`, halaman `/proyek/[id]/gantt`.
> Fase 2: tabel `task_dependencies`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| `moveTaskDates(taskId, newStart)` (FR-19) | Geser rentang + kaskade successor FS yang tertabrak |
| `addDependency()` / `removeDependency()` | FS saja; tolak siklus/duplikat/refleksif |
| Kalender proyek & universal | Bulan/minggu task + fitur (per proyek atau lintas proyek + filter); klik; seret (task via move, fitur via override) |

---

## Modul: Dashboard Produksi

> **Status:** Draft Fase 1 (US-026, digabung ke `/proyek` atas permintaan pemilik) —
> `services/production-dashboard.ts` + `services/production-export.ts`.
> Tanpa filter (dihapus); KPI + deadline dihitung keseluruhan.
> Fase 2: agregasi SQL.

| Fungsi | Definisi |
|--------|----------|
| Total Proyek / Proyek Aktif | Jumlah proyek (aktif = status Active) pada filter |
| Task Selesai / Berlangsung / Blocked | Hitung status task lintas proyek (berlangsung = In Progress + Review) |
| Progress per proyek | Dari `getProjectProgress` (FR-17) |
| Deadline watch | Target ≤ 7 hari atau lewat, belum Completed/Cancelled |
| Ekspor Excel / PDF | SheetJS (KPI + Proyek) / jsPDF dari data tampil |

---

## Modul: Fitur (Backlog)

> **Status:** Draft Fase 1 (US-023) — `services/features.ts`, tipe `types/feature.ts`.
> Backlog di halaman detail proyek. Penjadwalan menyusul US-024.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listFeatures()` / `createFeature()` / `updateFeature()` / `deleteFeature()` | Nama, kategori, prioritas High/Medium/Low, developer, estimasi ≥1 hari |
| `ensureBacklogFromHandover(projectId, handoverId)` | Impor otomatis + idempoten (estimasi default 1 hari, PM menyesuaikan) |
| `convertFeatureToTask(featureId)` | Task mewarisi nama/developer/estimasi; anti konversi ganda |

---

## Modul: Content Planner

> **Status:** Draft Fase 1 (US-027) — mock di `frontend/src/mocks/content-ideas.ts`,
> diakses via `frontend/src/services/ideas.ts`. Halaman `/sosmed/planner`.
> Konstanta bersama Sosmed di `frontend/src/types/sosmed.ts`.
> Fase 2: tabel `content_ideas`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| Skor brief | Field terisi ÷ 5 (FR-21) |
| Ambang Siap Produksi | 5/5 (Q-003 A) — ditolak dengan pesan bila kurang |
| CRUD ide | Brand (3 lini), pillar, funnel, multi-platform, 4 status kelayakan |

---

## Modul: Content Materials

> **Status:** Draft Fase 1 (US-028) — mock di `frontend/src/mocks/materials.ts`,
> diakses via `frontend/src/services/materials.ts`. Halaman `/sosmed/materi`.
> Fase 2: tabel `content_materials`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| `listMaterials()` / `getMaterial()` / `createMaterial()` / `saveMaterial()` | ID MAT-xxxx otomatis; status awal Draf; jam HH:MM |
| `createMaterialFromIdea(ideaId)` | Hanya ide Disetujui/Siap Produksi |
| `submitReview(materialId, {decision, reviewer, feedback?, evidenceLink?})` (US-030) | Rev 0,1,...; feedback wajib saat Ditolak; Disetujui → status Disetujui; Ditolak → Draf |

---

## Modul: Quality Gate

> **Status:** Draft Fase 1 (US-029) — `services/quality-gate.ts`.
> Checklist + jadwal + rilis di halaman detail `/sosmed/materi/[id]`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| `setGateItem(materialId, item, checked)` | 5 checklist; mengubah checklist menghanguskan pengecualian lama |
| `scheduleMaterial(materialId, {scheduleDate, releaseTime?, overrideReason?}, actor)` | Wajib Disetujui + gate penuh, atau Admin beralasan |
| `releaseMaterial(materialId, actor, overrideReason?)` | Dari Dijadwalkan + gate penuh (atau override Admin) |

---

## Modul: Publications

> **Status:** Draft Fase 1 (US-031) — `services/publications.ts`, tipe
> `types/publication.ts`. Distribusi di halaman detail materi.
> Fase 2: tabel `publications`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| `createPublication(materialId, platform, pattern)` | 1 platform = 1 PUB; pola Single/Crosspost; jadwal warisan materi |
| `getUncoveredPlatforms(materialId)` (rekonsiliasi) | Target dari ide asal (atau 5 platform) minus yang sudah ada |
| `recordRelease(publicationId, {releaseDate, liveLink})` (US-033) | Aktual rilis; mengunci jadwal-ulang; urgensi otomatis via kalender |

---

## Modul: Kalender Publikasi

> **Status:** Draft Fase 1 (US-032) — `services/calendar.ts`.
> Halaman `/sosmed/kalender`. Ambang Q-004 B (konfigurabel; penuh di US-041).

| Fungsi | Aturan bisnis |
|--------|---------------|
| `getCalendarEntries(filter, now)` (FR-24) | Dari distribusi; filter brand/platform/approval/gate; urgensi ok/overdue/critical |
| `reschedulePublication(id, date)` | Seret-jadwalkan ulang; ditolak bila sudah live |

---

## Modul: Analytics

> **Status:** Draft Fase 1 (US-035) — `services/metrics.ts`, tipe `types/metric.ts`.
> Halaman `/sosmed/analitik`. Rumus Q-002 C + kunci Q-007 B.
> Fase 2: tabel `post_metrics`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| ER otomatis | `(Likes + Comments + Shares + Saves) ÷ Reach × 100%` (tooltip) |
| `recordMetric(pubId, input, by)` | 7 angka ≥ 0; dedup satu Final per publikasi |
| `updateMetric()` / `deleteMetric()` | Final terkunci kecuali Super Admin / Executive / Leader |

---

## Modul: Pertumbuhan Akun

> **Status:** Draft Fase 1 (US-036) — `services/growth.ts`.
> Halaman `/sosmed/pertumbuhan`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| Net Growth otomatis | `(Masuk − Unfollows) ÷ Awal × 100%` (tooltip + grafik) |
| `recordGrowth()` | Per platform per bulan (unik); grafik tren CSS |

---

## Modul: KPI Scorecard Sosmed

> **Status:** Draft Fase 1 (US-039) — `services/scorecard.ts`.
> Halaman `/sosmed/scorecard`. Target interim (resmi US-041).

| KPI | Definisi capaian |
|-----|------------------|
| Content Production | Materi dibuat pada periode + brand |
| Reach & Awareness | Σ reach metrik (Terverifikasi bila ada Final) |
| Engagement Rate | Rata-rata ER metrik |
| Audience Growth | Σ (masuk − unfollows) growth |
| Social Footprint | Σ followers terkini per platform |
| WhatsApp Lead Handover | Inquiry dialihkan pada periode |

---

## Modul: Community & Inquiry

> **Status:** Draft Fase 1 — community di US-037 (`services/community.ts`);
> inquiry menyusul US-038. Halaman `/sosmed/komunitas`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| Waktu tanggap otomatis | Menit masuk → dibalas (FR-26) |
| SLA 30 menit | Interim (resmi US-041); `%` tercapai untuk dashboard |
| `recordInteraction()` / `markInteractionReplied()` | Validasi kanal/platform/tipe + urutan waktu |

---

## Modul: Inquiry & Handover WA

> **Status:** Draft Fase 1 (US-038) — `services/inquiries.ts`.
> Halaman `/sosmed/inquiry`. Ambang interim 15 mnt (resmi US-041).

| Fungsi | Aturan bisnis |
|--------|---------------|
| SLA routing otomatis | Masuk → WA ≤ 15 mnt (FR-26) |
| `convertInquiryToLead()` (FR-28) | Lead New + `source: Sosmed/<platform>`; inquiry → Handover Selesai + tertaut; anti ganda |

---

## Modul: Evaluasi Strategi (KIST)

> **Status:** Draft Fase 1 (US-040) — `services/evaluations.ts`.
> Halaman `/sosmed/evaluasi`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| CRUD + filter kategori/brand/periode | Keep/Improve/Stop/Test + pillar/format + bukti |
| Kategori Test (FR-29) | Hipotesis wajib; rencana/target/dampak/hasil opsional |

---

## Modul: Assets

> **Status:** Draft Fase 1 (US-034) — mock di `frontend/src/mocks/assets.ts`,
> diakses via `frontend/src/services/assets.ts`. Halaman `/sosmed/aset`.
> Fase 2: tabel `assets`.

| Fungsi | Aturan bisnis |
|--------|---------------|
| CRUD aset | Nama, tipe, link cloud, pemilik, izin, masa berlaku (opsional) |
| `listAssetsWithStatus()` (FR-27) | Kedaluwarsa + peringatan ≤30 hari |
| `linkAssetsToMaterial(materialId, assetIds)` | Kedaluwarsa ditolak dengan pesan; opsi kedaluwarsa terkunci di UI |

---

## Modul: Audit Log

> **Status:** Backend Fase 3 (US-004, FR-2) — baca dari tabel `audit_logs`
> (trigger DB) via `queryAuditLogs`; tulis mock modul lain tetap sampai swap
> masing-masing. Halaman `/pengaturan/audit-log` (Super Admin + Leader).

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `queryAuditLogs({actor?, entityType?, dateFrom?, dateTo?, limit?})` | Terbaru dulu, maks 200 (default 100); aktor contains case-insensitive; tanggal batas hari WIB; nilai jsonb → string |
| Halaman Audit Log | Filter aktor/modul/rentang tanggal; nilai lama/baru di `<details>`; TANPA aksi ubah/hapus (AC3, RLS tanpa policy tulis)

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

## Modul: Pengaturan KPI, SLA &amp; Routing

> **Status:** Backend Fase 3 (US-041, FR-30) — baca/tulis langsung ke Supabase
> via `frontend/src/services/settings.ts`; tipe dan validasi di
> `frontend/src/types/settings.ts`; hook pembaca `usePortalSettings`; halaman
> `/pengaturan/kpi-sla` (Super Admin).
>
> Tabel yang sudah ada (tanpa migrasi baru): `settings(key, value jsonb)` dan
> `holidays(day, name)`. RLS: semua user terautentikasi boleh membaca; hanya
> Super Admin yang boleh menulis. Trigger audit generik mencatat old/new value
> setiap perubahan. Nilai final historis (mis. snapshot KPI Final, publikasi
> live) tidak diubah — pengaturan hanya memengaruhi perhitungan berikutnya.

| Key `settings` | Default | Dipakai di |
|----------------|---------|------------|
| `sla.response_minutes` | 30 | Komunitas (`getSlaCompliance`, `isSlaMet`) |
| `sla.routing_minutes` | 15 | Inquiry (`isRoutingSlaMet`) |
| `release.critical_hours` | 24 | Kalender publikasi (`getCalendarEntries`) |
| `service_hours` | `Asia/Jakarta`, Senin–Jumat 09:00–18:00 | Acuan jam layanan |
| `wa.numbers` | `{Pytagotech:"",Pytabelajar:"",Pytafix:""}` | Inquiry (nomor resmi per brand) |
| `kpi.targets` | `{}` (memakai target dasar) | Scorecard Sosmed (per brand) |

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `getPortalSettings()` | Gabung semua key + `holidays`; nilai rusak/absen jatuh ke default; error DB tetap mengembalikan default agar UI tampil |
| `saveOperationalSettings(input)` | Validasi SLA 1–1440 menit, kritis 1–8760 jam, jam `HH:MM` dengan mulai lebih awal dari selesai, minimal satu hari, zona waktu 1–64 karakter, nomor WA `+62…`/`08…` 8–16 digit (boleh kosong). Menulis lima key dengan `update` lalu `insert` bila belum ada |
| `saveKpiTargets(targets)` | Target per brand boleh parsial, angka ≥ 0, maks. 2 desimal; nilai kosong dihapus dan jatuh ke target dasar `12 / 500000 / 3 / 500 / 50000 / 20` |
| `listHolidays()` / `createHoliday(day, name?)` / `deleteHoliday(day)` | Tanggal `YYYY-MM-DD` valid; duplikat dan nama lebih dari 120 karakter ditolak; DELETE 0 baris = error; perubahan langsung dipakai penjadwalan fitur |
| `resolveKpiTargets(targets, brand)` | Target efektif = default ditimpa nilai tersimpan brand tersebut |

**Target dasar KPI:** production 12 konten, reach 500.000, engagement 3%, growth 500 follower, footprint 50.000 follower, handover 20.

**Konsumsi modul:** `CommunityManager` memakai `sla.response_minutes`; `InquiryManager` memakai `sla.routing_minutes` + `wa.numbers`; `SosmedScorecard` mengirim `kpi.targets` ke `getScorecard`; `PublicationCalendar` memakai `release.critical_hours`; `FeatureScheduleSection` memakai `holidays` (kapasitas developer masih mock).

---

## Modul: Arsip & Backup

> **Status:** Backend Fase 3 (US-043, FR-5) — `services/archive.ts`, tipe di
> `types/archive.ts`, halaman `/pengaturan/arsip` (Super Admin).
> Soft archive memakai RPC database yang sudah ada: `archive_entity` dan
> `restore_entity` (`security invoker` + cek `private.is_super_admin()`).
> Tidak ada migrasi/tabel baru.

| Fungsi service | Aturan bisnis |
|----------------|---------------|
| `listArchiveItems()` | Baca `leads`, `projects`, `content_materials` (maks. 500 terbaru per modul) + nama tim/klien; hasil dinormalisasi menjadi `ArchiveItem`; data aktif dan arsip dibedakan dari `archivedAt` |
| `archiveRecord(type, id)` | Panggil RPC `archive_entity`, lalu verifikasi `archived_at` terisi; tipe valid: `lead`, `project`, `content_material`; error otorisasi/0 baris tidak dilaporkan sebagai sukses |
| `restoreRecord(type, id)` | Panggil RPC `restore_entity`, lalu verifikasi `archived_at` kembali `null` |
| `exportModuleCsv(type)` | Ekspor **seluruh baris** modul (aktif + arsip) dengan paging 1.000 baris; kolom `Diarsipkan` menunjukkan status; hasil `{ filename, content }` |
| `buildCsv(headers, rows)` | CSV RFC 4180 + BOM UTF-8, escape koma/kutip/baris baru |
| `archiveCsvFilename(type, date?)` | `lead-YYYY-MM-DD.csv`, `project-YYYY-MM-DD.csv`, `materi-konten-YYYY-MM-DD.csv` |

**Kontrak data:**

```ts
type ArchiveEntityType = "lead" | "project" | "content_material";

interface ArchiveItem {
  type: ArchiveEntityType;
  id: string;              // UUID database
  displayId: string;       // LEAD-001 / PRJ-001 / MAT-0001
  title: string;
  subtitle: string;        // modul + PIC/PM/klien + jadwal
  status: string;
  archivedAt: string | null;
  updatedAt: string;
}
```

**Hak akses:** halaman dibungkus `RequireRole(["Super Admin"])`; RPC menolak
role lain dengan `42501`. RLS modul tetap berlaku saat daftar/ekspor dibaca.
**Backup:** prosedur lengkap ada di [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)
bagian *Backup & Restore Supabase*; retensi arsip menunggu Q-018.

---

## Modul: Panduan & RACI

> **Status:** Draft Fase 1 (US-042) — `services/guides.ts`.
> Halaman `/pengaturan/panduan` (baca semua role, sunting Admin).

| Fungsi | Aturan bisnis |
|--------|---------------|
| `listGuides()` / `updateGuide(slug, markdown)` | Markdown `#/##/-/tebal/link`; isi tak boleh kosong |
| `listRaci()` / `setRaciCell(activity, role, value)` | 3 aktivitas × 7 role; nilai R/A/C/I/kosong |

---

## Modul: Pencarian Global & Beranda

> **Status:** Draft Fase 1 (US-044) — `services/search.ts`.
> Ctrl/Cmd+K di header + seksi Tugas saya di beranda.
> Fase 2: RLS memfilter hasil per hak akses (FR-31).

| Fungsi | Aturan bisnis |
|--------|---------------|
| `globalSearch(query, user)` | Lead, klien, proyek, task, materi; min 2 huruf; maks 30 hasil |
| `getMyWork(user)` | Task assignee + follow-up overdue + review + SLA per role |
