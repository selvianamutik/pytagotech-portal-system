import { listInteractions } from "@/services/community";
import { listLeads } from "@/services/leads";
import { isFollowUpOverdue } from "@/services/lead-activities";
import { listMaterials } from "@/services/materials";
import { listProjects } from "@/services/projects";
import { listTaskSummaries } from "@/services/tasks";
import type { PortalUser } from "@/types/auth";
import type { ServiceResult } from "@/services/result";

/**
 * Pencarian global + Tugas saya (US-044, FR-31).
 * Hasil pencarian: lead, klien, proyek, task, materi.
 * Hak akses: Fase 1 mock menampilkan semua (tandem RLS US-003 di Fase 2
 * memfilter server-side dengan signature yang sama + user).
 */

export interface SearchHit {
  kind: "lead" | "klien" | "proyek" | "task" | "materi";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearch(
  query: string,
  user: PortalUser | null
): Promise<ServiceResult<SearchHit[]>> {
  void user;
  const q = query.trim();
  if (q.length < 2) {
    return { data: [], error: null };
  }
  const { createClient } = await import("@/lib/supabase/client");
  const { data, error } = await createClient().rpc("global_search", {
    search_query: q,
    result_limit: 30,
  });
  if (error) return { data: null, error: error.message };
  const kindMap: Record<string, SearchHit["kind"]> = { lead: "lead", client: "klien", project: "proyek", task: "task", content_material: "materi" };
  return { data: ((data ?? []) as { entity_type: string; display_id: string; title: string; subtitle: string; href: string }[]).flatMap((row) => kindMap[row.entity_type] ? [{ kind: kindMap[row.entity_type]!, id: row.display_id, title: row.title, subtitle: row.subtitle, href: row.href }] : []), error: null };
}

export interface MyWorkItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  urgent: boolean;
}

export interface MyWork {
  tasks: MyWorkItem[];
  followUps: MyWorkItem[];
  reviews: MyWorkItem[];
  sla: MyWorkItem[];
}

/**
 * "Tugas saya" di beranda sesuai role (US-044): task assignee,
 * follow-up overdue milik PIC, materi menunggu review (sosmed/leader),
 * interaksi komunitas belum dibalas (SLA).
 */
export async function getMyWork(user: PortalUser | null): Promise<ServiceResult<MyWork>> {
  const empty: MyWork = { tasks: [], followUps: [], reviews: [], sla: [] };
  if (!user) {
    return { data: empty, error: null };
  }
  const firstName = user.name.split(" ")[0] as string;
  const [{ data: projects }, { data: leads }, { data: materials }, { data: interactions }] =
    await Promise.all([listProjects(), listLeads(), listMaterials(), listInteractions()]);

  const tasks: MyWorkItem[] = [];
  for (const item of projects ?? []) {
    const { data: projectTasks } = await listTaskSummaries(item.project.id);
    for (const task of projectTasks ?? []) {
      if (
        task.isActive !== false &&
        task.status !== "Done" &&
        (task.assignee === user.name || task.assignee === firstName)
      ) {
        tasks.push({
          id: task.id,
          label: task.title,
          detail: `${item.project.name} · ${task.status}`,
          href: `/proyek/${item.project.id}/tasks`,
          urgent: task.status === "Blocked",
        });
      }
    }
  }

  const followUps: MyWorkItem[] = (leads ?? [])
    .filter(
      (lead) =>
        (lead.picName === user.name || lead.picName === firstName) &&
        isFollowUpOverdue(lead.nextFollowUp, lead.status)
    )
    .map((lead) => ({
      id: lead.id,
      label: `Follow up ${lead.companyName}`,
      detail: `Jadwal ${lead.nextFollowUp} terlewat`,
      href: "/crm/leads",
      urgent: true,
    }));

  const canReview =
    user.roles.includes("Executive / Leader") ||
    user.roles.includes("Social Media Specialist") ||
    user.roles.includes("Super Admin");
  const reviews: MyWorkItem[] = canReview
    ? (materials ?? [])
        .filter((material) => material.status === "Draf")
        .map((material) => ({
          id: material.id,
          label: `Review ${material.title}`,
          detail: `${material.brand} · menunggu approval`,
          href: `/sosmed/materi/${material.id}`,
          urgent: true,
        }))
    : [];

  const sla: MyWorkItem[] = (interactions ?? [])
    .filter((interaction) => !interaction.repliedAt)
    .map((interaction) => ({
      id: interaction.id,
      label: `${interaction.channel} ${interaction.platform} belum dibalas`,
      detail: `${interaction.type}`,
      href: "/sosmed/komunitas",
      urgent: true,
    }));

  return { data: { tasks, followUps, reviews, sla }, error: null };
}
