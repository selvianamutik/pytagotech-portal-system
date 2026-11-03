import { createClient } from "@/lib/supabase/server";
import { PORTAL_ROLES } from "@/types/auth";
import type {
  ActivityItem,
  DashboardMetric,
  DashboardSnapshot,
  NavigationItem,
  PortalModule,
  WorkQueueItem,
} from "@/types/dashboard";
import type { ServiceResult } from "@/services/result";

/**
 * Snapshot beranda portal (US-001, US-044).
 *
 * `currentUser` dibaca dari sesi Supabase sisi server (`profiles` +
 * `user_roles`) — bukan lagi mock. `navigation` adalah konfigurasi statis
 * (bukan data), sedangkan `metrics`/`workQueue`/`activities` dirangkum dari
 * tabel nyata: leads, deals, projects, tasks, content_materials, audit_logs,
 * dan team_members. Data yang gagal dimuat didegradasi ke koleksi kosong
 * agar halaman tetap dapat dirender.
 */

const NAVIGATION: NavigationItem[] = [
  { label: "Ringkasan kerja", module: "Beranda", href: "/", roles: ["Semua role"] },
  { label: "Database Lead", module: "CRM", href: "/crm/leads", badge: 12, roles: ["Sales / Marketing", "Executive / Leader"] },
  { label: "Interested Leads", module: "CRM", href: "/crm/interested", badge: 2, roles: ["Sales / Marketing", "Executive / Leader"] },
  { label: "Dashboard CRM", module: "CRM", href: "/crm/dashboard", roles: ["Sales / Marketing", "Executive / Leader"] },
  { label: "Deal Handover", module: "Klien & Handover", href: "/handover", badge: 7, roles: ["Sales / Marketing", "Project Manager"] },
  { label: "Master Klien", module: "Klien & Handover", href: "/klien", roles: ["Sales / Marketing", "Project Manager"] },
  { label: "Proyek", module: "Proyek", href: "/proyek", roles: ["Project Manager", "Developer", "Executive / Leader"] },
  { label: "Kalender Kerja", module: "Proyek", href: "/kalender", roles: ["Project Manager", "Developer", "Executive / Leader"] },
  { label: "Template Task", module: "Pengaturan", href: "/pengaturan/template-task", roles: ["Super Admin"] },
  { label: "Developer", module: "Pengaturan", href: "/pengaturan/developer", roles: ["Super Admin"] },
  { label: "Task Board", module: "Proyek", href: "/proyek/board", badge: 18, roles: ["Project Manager", "Developer"] },
  { label: "Content Planner", module: "Sosmed", href: "/sosmed/planner", badge: 9, roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Produksi Konten", module: "Sosmed", href: "/sosmed/materi", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Kalender Publikasi", module: "Sosmed", href: "/sosmed/kalender", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Analytics", module: "Sosmed", href: "/sosmed/analitik", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Pertumbuhan Akun", module: "Sosmed", href: "/sosmed/pertumbuhan", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Komunitas", module: "Sosmed", href: "/sosmed/komunitas", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Inquiry", module: "Sosmed", href: "/sosmed/inquiry", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "KPI Scorecard", module: "Sosmed", href: "/sosmed/scorecard", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Evaluasi KIST", module: "Sosmed", href: "/sosmed/evaluasi", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Asset Library", module: "Sosmed", href: "/sosmed/aset", roles: ["Social Media Specialist", "Executive / Leader"] },
  { label: "Pengguna", module: "Pengaturan", href: "/pengaturan/pengguna", roles: ["Super Admin"] },
  { label: "Audit Log", module: "Pengaturan", href: "/pengaturan/audit-log", roles: ["Super Admin", "Executive / Leader"] },
  { label: "Arsip & Backup", module: "Pengaturan", href: "/pengaturan/arsip", roles: ["Super Admin"] },
  { label: "Panduan & RACI", module: "Pengaturan", href: "/pengaturan/panduan", roles: ["Super Admin"] },
  { label: "Master Data", module: "Pengaturan", href: "/pengaturan/master-data", roles: ["Super Admin"] },
  { label: "KPI, SLA & Routing", module: "Pengaturan", href: "/pengaturan/kpi-sla", roles: ["Super Admin"] },
  { label: "Reset Data Demo", module: "Pengaturan", href: "/pengaturan/reset-data", roles: ["Super Admin"] },
];

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface UserRoleRow {
  user_id: string;
  role_name: string;
}

interface LeadSummaryRow {
  display_id: string;
  company_name: string;
  status: string;
  next_follow_up: string | null;
  archived_at: string | null;
}

interface DealSummaryRow {
  display_id: string;
  title: string;
  status: string;
  deadline: string;
}

interface ProjectSummaryRow {
  display_id: string;
  name: string;
  status: string;
  archived_at: string | null;
}

interface TaskSummaryRow {
  display_id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  target_date: string | null;
  is_active: boolean;
}

interface MaterialSummaryRow {
  display_id: string;
  title: string;
  status: string;
}

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
}

const ENTITY_MODULE: Record<string, PortalModule> = {
  leads: "CRM",
  deals: "Klien & Handover",
  projects: "Proyek",
  tasks: "Proyek",
  features: "Proyek",
  content_materials: "Sosmed",
  publications: "Sosmed",
  post_metrics: "Sosmed",
};

function moduleFor(entityType: string): PortalModule {
  return ENTITY_MODULE[entityType] ?? "Pengaturan";
}

function activityVerb(action: string): string {
  switch (action) {
    case "insert":
      return "menambahkan";
    case "update":
      return "memperbarui";
    case "delete":
      return "menghapus";
    default:
      return "mengubah";
  }
}

function stringifyValue(value: unknown | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

function isValidRole(role: string): boolean {
  return (PORTAL_ROLES as readonly string[]).includes(role);
}

export async function getDashboardSnapshot(): Promise<
  ServiceResult<DashboardSnapshot>
> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { data: null, error: "Sesi tidak ditemukan." };
  }
  const userId = session.user.id;

  const [profileResult, rolesResult, leadsResult, dealsResult, projectsResult, tasksResult, materialsResult, auditResult, membersResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, is_active, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("user_id, role_name").eq("user_id", userId),
      supabase.from("leads").select("display_id, company_name, status, next_follow_up, archived_at"),
      supabase.from("deals").select("display_id, title, status, deadline"),
      supabase.from("projects").select("display_id, name, status, archived_at"),
      supabase.from("tasks").select("display_id, title, status, assignee_id, target_date, is_active"),
      supabase.from("content_materials").select("display_id, title, status"),
      supabase
        .from("audit_logs")
        .select("id, actor_id, actor_name, action, entity_type, entity_id, old_value, new_value, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("team_members").select("id, name"),
    ]);

  const profile = profileResult.data as ProfileRow | null;
  if (!profile) {
    return { data: null, error: "Profil portal belum tersedia." };
  }
  const roles = ((rolesResult.data ?? []) as UserRoleRow[])
    .filter((row) => row.user_id === userId && isValidRole(row.role_name))
    .map((row) => row.role_name);

  const currentUser = {
    name: profile.name,
    email: profile.email,
    roles: roles.length > 0 ? roles : ["Sales / Marketing"],
  };

  const leads = (leadsResult.data ?? []) as LeadSummaryRow[];
  const deals = (dealsResult.data ?? []) as DealSummaryRow[];
  const projects = (projectsResult.data ?? []) as ProjectSummaryRow[];
  const tasks = (tasksResult.data ?? []) as TaskSummaryRow[];
  const materials = (materialsResult.data ?? []) as MaterialSummaryRow[];
  const auditRows = (auditResult.data ?? []) as AuditLogRow[];

  const memberNames = new Map<string, string>(
    ((membersResult.data ?? []) as { id: string; name: string }[]).map((m) => [m.id, m.name])
  );

  const activeLeads = leads.filter((lead) => !lead.archived_at && lead.status !== "Lost").length;
  const awaitingDeals = deals.filter((deal) => deal.status === "Menunggu Konfirmasi Produksi").length;
  const activeProjects = projects.filter((project) => !project.archived_at).length;
  const draftMaterials = materials.filter((material) => material.status === "Draf").length;

  const metrics: DashboardMetric[] = [
    { label: "Lead aktif", value: String(activeLeads), change: `${leads.length} total lead`, tone: "info" },
    { label: "Handover menunggu", value: String(awaitingDeals), change: "menunggu keputusan PM", tone: "warning" },
    { label: "Proyek aktif", value: String(activeProjects), change: `${projects.length} total proyek`, tone: "success" },
    { label: "Materi menunggu review", value: String(draftMaterials), change: "status Draf", tone: "priority" },
  ];

  const workQueue: WorkQueueItem[] = [];

  for (const lead of leads) {
    if (lead.archived_at || !lead.next_follow_up || lead.status === "Lost") {
      continue;
    }
    workQueue.push({
      id: lead.display_id,
      title: lead.company_name,
      module: "CRM",
      owner: lead.status,
      status: lead.status,
      dueDate: `${lead.next_follow_up}T00:00:00Z`,
      tone: "warning",
    });
  }

  for (const deal of deals) {
    if (deal.status !== "Menunggu Konfirmasi Produksi") {
      continue;
    }
    workQueue.push({
      id: deal.display_id,
      title: deal.title,
      module: "Klien & Handover",
      owner: "Project Manager",
      status: deal.status,
      dueDate: `${deal.deadline}T00:00:00Z`,
      tone: "info",
    });
  }

  for (const task of tasks) {
    if (task.is_active === false || task.status === "Done") {
      continue;
    }
    const assigneeName = task.assignee_id
      ? (memberNames.get(task.assignee_id) ?? task.assignee_id)
      : "—";
    workQueue.push({
      id: task.display_id,
      title: task.title,
      module: "Proyek",
      owner: assigneeName,
      status: task.status,
      dueDate: task.target_date ? `${task.target_date}T00:00:00Z` : "",
      tone: task.status === "Blocked" ? "critical" : "success",
    });
  }

  for (const material of materials) {
    if (material.status !== "Draf") {
      continue;
    }
    workQueue.push({
      id: material.display_id,
      title: material.title,
      module: "Sosmed",
      owner: "Leader",
      status: material.status,
      dueDate: "",
      tone: "priority",
    });
  }

  const activities: ActivityItem[] = auditRows.map((row) => {
    const oldValue = stringifyValue(row.old_value);
    const newValue = stringifyValue(row.new_value);
    const label = oldValue && newValue ? "objek" : "entri";
    return {
      id: row.id,
      actor: row.actor_name,
      action: `${activityVerb(row.action)} ${label} ${row.entity_type}`,
      subject: row.entity_id,
      timestamp: row.created_at,
      module: moduleFor(row.entity_type),
    };
  });

  return {
    data: {
      currentUser,
      metrics,
      navigation: NAVIGATION,
      workQueue: workQueue.slice(0, 12),
      activities,
    },
    error: null,
  };
}