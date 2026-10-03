import { mockUsers } from "@/mocks/auth";
import { listClients } from "@/services/clients";
import { getDeal } from "@/services/deals";
import { ensureBacklogFromHandover } from "@/services/features";
import { generateTasksForProject } from "@/services/task-templates";
import { getProjectProgress } from "@/services/tasks";
import type { PortalUser } from "@/types/auth";
import type { CreateProjectInput, Project } from "@/types/project";
import { isProjectStatus } from "@/types/project";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan Proyek (US-019, FR-15). Fase 1: mock in-memory.
 * Proyek hanya lahir dari handover Dikonfirmasi (gerbang US-017),
 * satu handover = satu proyek.
 */

export const mockProjects: Project[] = [];

let projectStore: Project[] = structuredClone(mockProjects);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockProjects(): void {
  projectStore = structuredClone(mockProjects);
}

/** Daftar PM (role Project Manager + Super Admin) untuk dropdown. */
export function listProjectManagers(): string[] {
  return mockUsers
    .filter(
      (user) =>
        user.isActive &&
        (user.roles.includes("Project Manager") || user.roles.includes("Super Admin"))
    )
    .map((user) => user.name.split(" (")[0]);
}

export interface ProjectWithNames {
  project: Project;
  clientName: string;
  handoverCode: string;
  /** % dihitung otomatis dari task (US-020, FR-17). */
  progress: number;
}

/** Role yang boleh membuat/mengubah proyek: PM dan Admin (Super Admin). */
export function canManageProjects(user: PortalUser | null): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  return user.roles.includes("Project Manager") || user.roles.includes("Super Admin");
}

async function withNames(project: Project): Promise<ProjectWithNames> {
  const { data: clients } = await listClients();
  const { data: found } = await getDeal(project.handoverId);
  return {
    project: { ...project },
    clientName:
      (clients ?? []).find((client) => client.id === project.clientId)?.companyName ??
      "Klien tidak dikenal",
    handoverCode: found?.deal.code ?? "-",
    progress: await getProjectProgress(project.id),
  };
}

export async function listProjects(): Promise<ServiceResult<ProjectWithNames[]>> {
  const items: ProjectWithNames[] = [];
  for (const project of [...projectStore].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )) {
    items.push(await withNames(project));
  }
  return { data: items, error: null };
}

export async function getProject(
  projectId: string
): Promise<ServiceResult<ProjectWithNames>> {
  const project = projectStore.find((item) => item.id === projectId);
  if (!project) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  return { data: await withNames(project), error: null };
}

export function findProjectByHandover(handoverId: string): Project | null {
  const project = projectStore.find((item) => item.handoverId === handoverId);
  return project ? { ...project } : null;
}

export interface ProjectQuery {
  search?: string;
  statuses?: Project["status"][];
  pmNames?: string[];
  clientIds?: string[];
}

/**
 * Daftar proyek dengan pencarian + filter status/PM/klien (US-020).
 * Fase 2: query Supabase server-side dengan parameter sama.
 */
export async function queryProjects(
  query: ProjectQuery
): Promise<ServiceResult<ProjectWithNames[]>> {
  const { data } = await listProjects();
  const search = (query.search ?? "").trim().toLowerCase();
  const items = (data ?? []).filter((item) => {
    if (search) {
      const haystack =
        `${item.project.name} ${item.project.code} ${item.clientName} ${item.project.pmName}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    if (query.statuses && query.statuses.length > 0 && !query.statuses.includes(item.project.status)) {
      return false;
    }
    if (query.pmNames && query.pmNames.length > 0 && !query.pmNames.includes(item.project.pmName)) {
      return false;
    }
    if (query.clientIds && query.clientIds.length > 0 && !query.clientIds.includes(item.project.clientId)) {
      return false;
    }
    return true;
  });
  return { data: items, error: null };
}

/**
 * Buat proyek dari handover Dikonfirmasi (FR-15): salin klien, nama,
 * kode, nilai, deadline, dan daftar fitur (fitur dibaca US-023 dari
 * handover tertaut). Template task di-generate US-021.
 */
export async function createProjectFromHandover(
  handoverId: string,
  input: CreateProjectInput
): Promise<ServiceResult<Project>> {
  const { data: found } = await getDeal(handoverId);
  if (!found) {
    return { data: null, error: "Deal handover tidak ditemukan." };
  }
  const deal = found.deal;
  if (deal.status !== "Dikonfirmasi") {
    return {
      data: null,
      error: "Hanya handover berstatus Dikonfirmasi yang dapat dijadikan proyek.",
    };
  }
  if (findProjectByHandover(handoverId)) {
    return { data: null, error: "Handover ini sudah dijadikan proyek." };
  }
  if (!listProjectManagers().includes(input.pmName)) {
    return { data: null, error: "PM tidak dikenal." };
  }
  if (Number.isNaN(Date.parse(input.startDate))) {
    return { data: null, error: "Tanggal mulai tidak valid." };
  }
  if (input.startDate > deal.deadline) {
    return { data: null, error: "Tanggal mulai tidak boleh melewati deadline handover." };
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: `PRJ-${String(projectStore.length + 1).padStart(3, "0")}`,
    name: found.displayName,
    code: deal.code,
    clientId: deal.clientId,
    pmName: input.pmName,
    startDate: input.startDate,
    targetDate: deal.deadline,
    value: deal.value,
    status: "Planning",
    handoverId: deal.id,
    createdAt: now,
    updatedAt: now,
  };
  projectStore.push(project);
  // Task standar ter-generate otomatis dari template (US-021, FR-16).
  await generateTasksForProject(project.id, project.startDate);
  // Fitur handover masuk backlog otomatis (US-023).
  await ensureBacklogFromHandover(project.id, project.handoverId);
  return { data: { ...project }, error: null };
}

export interface UpdateProjectInput {
  status?: Project["status"];
  pmName?: string;
  startDate?: string;
  targetDate?: string;
}

/**
 * Ubah proyek (US-020). UI memanggil hanya untuk PM/Admin
 * (canManageProjects); Fase 2 ditegakkan RLS.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ServiceResult<Project>> {
  const project = projectStore.find((item) => item.id === projectId);
  if (!project) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  if (input.status && !isProjectStatus(input.status)) {
    return { data: null, error: "Status proyek tidak dikenal." };
  }
  if (input.pmName && !listProjectManagers().includes(input.pmName)) {
    return { data: null, error: "PM tidak dikenal." };
  }
  const startDate = input.startDate ?? project.startDate;
  const targetDate = input.targetDate ?? project.targetDate;
  if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(targetDate))) {
    return { data: null, error: "Tanggal proyek tidak valid." };
  }
  if (startDate > targetDate) {
    return { data: null, error: "Tanggal mulai tidak boleh melewati target selesai." };
  }
  if (input.status) {
    project.status = input.status;
  }
  if (input.pmName) {
    project.pmName = input.pmName;
  }
  project.startDate = startDate;
  project.targetDate = targetDate;
  project.updatedAt = new Date().toISOString();
  return { data: { ...project }, error: null };
}
