import { beforeEach, describe, expect, it } from "vitest";

import { buildExcelFile, buildPdfFile } from "@/services/production-export";
import { daysUntil, getProductionDashboard } from "@/services/production-dashboard";
import type { ProductionDashboardData } from "@/services/production-dashboard";
import { resetMockAudit } from "@/services/audit";
import { resetMockClients } from "@/services/clients";
import { resetMockCollaboration } from "@/services/collaboration";
import { resetMockDeals } from "@/services/deals";
import { resetMockTerms } from "@/services/deal-terms";
import { transitionDealStatus } from "@/services/deal-workflow";
import { createProjectFromHandover, resetMockProjects } from "@/services/projects";
import { addTaskSummary, resetMockTasks, updateTaskSummary } from "@/services/tasks";

const pm = { id: "USR-003", name: "Raka", roles: ["Project Manager"] };

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
  resetMockAudit();
  resetMockCollaboration();
  resetMockProjects();
  resetMockTasks();
});

const sample: ProductionDashboardData = {
  kpi: { totalProjects: 1, activeProjects: 1, tasksDone: 2, tasksInProgress: 1, tasksBlocked: 0 },
  projects: [
    {
      projectId: "PRJ-001",
      projectName: "Website - PT X (PYT-1)",
      pmName: "Raka",
      status: "Active",
      targetDate: "2026-12-20",
      progress: 50,
      daysToDeadline: 77,
    },
  ],
  deadlineWatch: [],
};

describe("export builders", () => {
  it("Excel berisi blob dan nama file", () => {
    const { blob, filename } = buildExcelFile(sample);

    expect(filename).toBe("laporan-produksi.xlsx");
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toMatch(/spreadsheet/);
  });

  it("PDF berisi blob dan nama file", () => {
    const { blob, filename } = buildPdfFile(sample);

    expect(filename).toBe("laporan-produksi.pdf");
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe("daysUntil", () => {
  it("negatif bila lewat, nol hari ini", () => {
    expect(daysUntil("2026-10-04", "2026-10-04")).toBe(0);
    expect(daysUntil("2026-10-10", "2026-10-04")).toBe(6);
    expect(daysUntil("2026-10-01", "2026-10-04")).toBe(-3);
  });
});

describe("getProductionDashboard", () => {
  it("KPI dari 2 proyek seed (tanpa task)", async () => {
    const { data } = await getProductionDashboard({}, "2026-10-04");

    expect(data?.kpi.totalProjects).toBe(2);
    expect(data?.kpi.activeProjects).toBe(1);
    expect(data?.kpi.tasksDone).toBe(0);
    expect(data?.projects).toHaveLength(2);
    expect(data?.deadlineWatch).toHaveLength(0);
  });

  it("KPI, filter, dan deadline watch dari data nyata", async () => {
    await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: pm });
    const created = await createProjectFromHandover("HDV-001", {
      pmName: "Raka",
      startDate: "2026-10-05",
    });
    const projectId = created.data!.id;
    const t1 = await addTaskSummary({ projectId, title: "A", percent: 100 });
    await updateTaskSummary(t1.data!.id, { status: "Done" });
    const t2 = await addTaskSummary({ projectId, title: "B", percent: 20 });
    await updateTaskSummary(t2.data!.id, { status: "Blocked" });

    const full = await getProductionDashboard({}, "2026-10-04");
    expect(full.data?.kpi.totalProjects).toBe(3);
    expect(full.data?.kpi.tasksDone).toBe(1);
    expect(full.data?.kpi.tasksBlocked).toBe(1);

    // Target 2026-12-20 → jauh dari deadline (seed PRJ-001 12-15 ikut terpantau).
    expect(full.data?.deadlineWatch.map((row) => row.projectId)).toEqual([]);

    const near = await getProductionDashboard({}, "2026-12-18");
    expect(near.data?.deadlineWatch.map((row) => row.projectId)).toEqual(["PRJ-001", created.data!.id]);
    expect(near.data?.deadlineWatch[0]?.daysToDeadline).toBe(-3);

    expect((await getProductionDashboard({ pmName: "Feby" })).data?.kpi.totalProjects).toBe(0);
    expect(
      (await getProductionDashboard({ projectId: "PRJ-999" })).data?.kpi.totalProjects
    ).toBe(0);
  });
});
