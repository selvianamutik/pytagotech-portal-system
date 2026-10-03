import { mockUsers } from "@/mocks/auth";
import { listClients } from "@/services/clients";
import { getDeal } from "@/services/deals";
import type { CreateProjectInput, Project } from "@/types/project";
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
  return { data: { ...project }, error: null };
}
