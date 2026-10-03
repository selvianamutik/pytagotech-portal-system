import type { DashboardSnapshot } from "@/types/dashboard";

export const dashboardSnapshot: DashboardSnapshot = {
  currentUser: {
    name: "Dinda Prameswari",
    email: "dinda@pytagotech.test",
    roles: ["Super Admin", "Executive / Leader"],
  },
  metrics: [
    { label: "Lead aktif", value: "128", change: "+18 minggu ini", tone: "info" },
    { label: "Handover menunggu", value: "7", change: "3 perlu review PM", tone: "warning" },
    { label: "Proyek on track", value: "84%", change: "21 dari 25 proyek", tone: "success" },
    { label: "SLA sosmed", value: "92%", change: "routing WA rata-rata 11m", tone: "priority" },
  ],
  navigation: [
    { label: "Ringkasan kerja", module: "Beranda", href: "#beranda", roles: ["Semua role"] },
    { label: "Database Lead", module: "CRM", href: "#crm", badge: 12, roles: ["Sales / Marketing", "Executive / Leader"] },
    { label: "Deal Handover", module: "Klien & Handover", href: "#handover", badge: 7, roles: ["Sales / Marketing", "Project Manager"] },
    { label: "Task Board", module: "Proyek", href: "#proyek", badge: 18, roles: ["Project Manager", "Developer"] },
    { label: "Content Planner", module: "Sosmed", href: "#sosmed", badge: 9, roles: ["Social Media Specialist", "Executive / Leader"] },
    { label: "Pengguna", module: "Pengaturan", href: "/pengaturan/pengguna", roles: ["Super Admin"] },
    { label: "Master Data", module: "Pengaturan", href: "#pengaturan", roles: ["Super Admin"] },
  ],
  workQueue: [
    { id: "LEAD-024", title: "Follow up PT Aruna Digital", module: "CRM", owner: "Feby", status: "Follow Up", dueDate: "2026-10-04T08:30:00Z", tone: "warning" },
    { id: "HDV-007", title: "Konfirmasi produksi website Pytafix", module: "Klien & Handover", owner: "Raka", status: "Menunggu Konfirmasi Produksi", dueDate: "2026-10-04T10:00:00Z", tone: "info" },
    { id: "TSK-118", title: "Review desain landing Pytabelajar", module: "Proyek", owner: "Nabila", status: "Review", dueDate: "2026-10-05T03:00:00Z", tone: "priority" },
    { id: "MAT-0018", title: "Approval carousel edukasi API", module: "Sosmed", owner: "Leader", status: "Disetujui dengan Revisi Minor", dueDate: "2026-10-05T06:00:00Z", tone: "success" },
  ],
  activities: [
    { id: "ACT-001", actor: "Fira", action: "mengubah status lead menjadi Interest", subject: "CV Mandala Kreasi", timestamp: "2026-10-04T02:20:00Z", module: "CRM" },
    { id: "ACT-002", actor: "Raka", action: "menambahkan komentar handover", subject: "Portal internal Klien A", timestamp: "2026-10-04T02:05:00Z", module: "Klien & Handover" },
    { id: "ACT-003", actor: "Nabila", action: "memindahkan task ke Review", subject: "Landing Pytabelajar", timestamp: "2026-10-04T01:45:00Z", module: "Proyek" },
    { id: "ACT-004", actor: "Alya", action: "menjadwalkan publikasi TikTok", subject: "MAT-0018", timestamp: "2026-10-04T01:15:00Z", module: "Sosmed" },
  ],
};
