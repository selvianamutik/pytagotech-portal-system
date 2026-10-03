import { listTaskSummaries } from "@/services/tasks";
import { listProjects } from "@/services/projects";
import type { ServiceResult } from "@/services/result";

/**
 * Dashboard eksekutif produksi (US-026, FR-20).
 * Filter: PM, proyek, rentang waktu (tumpang tindih target).
 * "Divisi" menunggu definisi model (Q-013) — filter PMtim dipakai sementara.
 * Fase 2: agregasi SQL.
 */

export interface ProductionDashboardQuery {
  pmName?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductionKpi {
  totalProjects: number;
  activeProjects: number;
  tasksDone: number;
  tasksInProgress: number;
  tasksBlocked: number;
}

export interface ProductionProjectRow {
  projectId: string;
  projectName: string;
  pmName: string;
  status: string;
  targetDate: string;
  progress: number;
  /** Hari menuju deadline (negatif = lewat). */
  daysToDeadline: number;
}

export interface ProductionDashboardData {
  kpi: ProductionKpi;
  projects: ProductionProjectRow[];
  /** Mendekati (≤7 hari) atau melewati deadline, belum selesai. */
  deadlineWatch: ProductionProjectRow[];
}

export function daysUntil(dateIso: string, todayIso: string): number {
  const diff =
    new Date(`${dateIso}T00:00:00Z`).getTime() - new Date(`${todayIso}T00:00:00Z`).getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

export async function getProductionDashboard(
  query: ProductionDashboardQuery,
  todayIso: string = new Date().toISOString().slice(0, 10)
): Promise<ServiceResult<ProductionDashboardData>> {
  const { data: all } = await listProjects();
  const filtered = (all ?? []).filter((item) => {
    if (query.pmName && item.project.pmName !== query.pmName) {
      return false;
    }
    if (query.projectId && item.project.id !== query.projectId) {
      return false;
    }
    if (query.dateFrom && item.project.targetDate < query.dateFrom) {
      return false;
    }
    if (query.dateTo && item.project.startDate > query.dateTo) {
      return false;
    }
    return true;
  });

  let tasksDone = 0;
  let tasksInProgress = 0;
  let tasksBlocked = 0;
  const projects: ProductionProjectRow[] = [];
  for (const item of filtered) {
    const { data: tasks } = await listTaskSummaries(item.project.id);
    for (const task of tasks ?? []) {
      if (task.isActive === false) {
        continue;
      }
      if (task.status === "Done") {
        tasksDone += 1;
      } else if (task.status === "In Progress" || task.status === "Review") {
        tasksInProgress += 1;
      } else if (task.status === "Blocked") {
        tasksBlocked += 1;
      }
    }
    projects.push({
      projectId: item.project.id,
      projectName: item.project.name,
      pmName: item.project.pmName,
      status: item.project.status,
      targetDate: item.project.targetDate,
      progress: item.progress,
      daysToDeadline: daysUntil(item.project.targetDate, todayIso),
    });
  }

  const open = (status: string) => status !== "Completed" && status !== "Cancelled";
  const deadlineWatch = projects
    .filter((row) => open(row.status) && row.daysToDeadline <= 7)
    .sort((a, b) => a.daysToDeadline - b.daysToDeadline);

  return {
    data: {
      kpi: {
        totalProjects: filtered.length,
        activeProjects: filtered.filter((item) => item.project.status === "Active").length,
        tasksDone,
        tasksInProgress,
        tasksBlocked,
      },
      projects: projects.sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
      deadlineWatch,
    },
    error: null,
  };
}
