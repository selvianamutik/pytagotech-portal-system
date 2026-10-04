import { beforeEach, describe, expect, it } from "vitest";

import { resetMockAudit } from "@/services/audit";
import { resetMockClients } from "@/services/clients";
import { resetMockCollaboration } from "@/services/collaboration";
import { resetMockDeals } from "@/services/deals";
import { resetMockTerms } from "@/services/deal-terms";
import { transitionDealStatus } from "@/services/deal-workflow";
import {
  canManageProjects,
  createProjectFromHandover,
  queryProjects,
  resetMockProjects,
  updateProject,
} from "@/services/projects";
import { addTaskSummary, resetMockTasks } from "@/services/tasks";
import { mockUsers } from "@/mocks/auth";

const pm = { id: "USR-003", name: "Raka", roles: ["Project Manager"] };

async function seedProject() {
  await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: pm });
  const created = await createProjectFromHandover("HDV-001", {
    pmName: "Raka",
    startDate: "2026-10-05",
  });
  return created.data!.id;
}

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
  resetMockAudit();
  resetMockCollaboration();
  resetMockProjects();
  resetMockTasks();
});

describe("queryProjects", () => {
  it("filter pencarian, status, PM, dan klien", async () => {
    await seedProject();

    expect((await queryProjects({})).data).toHaveLength(3);
    expect((await queryProjects({ search: "sinar" })).data).toHaveLength(2);
    expect((await queryProjects({ search: "xyz" })).data).toHaveLength(0);
    expect((await queryProjects({ statuses: ["Active"] })).data).toHaveLength(1);
    expect((await queryProjects({ statuses: ["Planning"] })).data).toHaveLength(2);
    expect((await queryProjects({ pmNames: ["Feby"] })).data).toHaveLength(0);
    expect((await queryProjects({ clientIds: ["KLI-002"] })).data).toHaveLength(1);
    expect((await queryProjects({ clientIds: ["KLI-001"] })).data).toHaveLength(2);
  });
});

describe("progress", () => {
  it("rata-rata task level atas; 0 bila tanpa task", async () => {
    const projectId = await seedProject();
    // Bersihkan task hasil generate agar skenario terkendali.
    resetMockTasks();
    expect((await queryProjects({})).data?.[0]?.progress).toBe(0);

    await addTaskSummary({ projectId, title: "A", percent: 100 });
    const b = await addTaskSummary({ projectId, title: "B", percent: 50 });
    await addTaskSummary({ projectId, title: "B-1", percent: 0, parentId: b.data!.id });

    // % induk dihitung dari sub-task: B = 0 → (100 + 0) / 2 = 50.
    expect((await queryProjects({})).data?.[0]?.progress).toBe(50);
  });
});

describe("updateProject", () => {
  it("mengubah status, PM, dan tanggal dengan validasi", async () => {
    const projectId = await seedProject();

    const updated = await updateProject(projectId, {
      status: "Active",
      pmName: "Dinda Prameswari",
      targetDate: "2026-12-25",
    });
    expect(updated.error).toBeNull();
    expect(updated.data?.status).toBe("Active");

    expect((await updateProject("PRJ-999", { status: "Active" })).error).toBe(
      "Proyek tidak ditemukan."
    );
    expect((await updateProject(projectId, { pmName: "Hantu" })).error).toMatch(/PM/);
    expect(
      (await updateProject(projectId, { startDate: "2026-12-30", targetDate: "2026-12-01" })).error
    ).toMatch(/melewati target/);
  });
});

describe("canManageProjects", () => {
  it("hanya PM dan Super Admin aktif", () => {
    const raka = mockUsers.find((user) => user.id === "USR-003") ?? null;
    const dinda = mockUsers.find((user) => user.id === "USR-001") ?? null;
    const feby = mockUsers.find((user) => user.id === "USR-002") ?? null;
    const sinta = mockUsers.find((user) => user.id === "USR-005") ?? null;

    expect(canManageProjects(raka)).toBe(true);
    expect(canManageProjects(dinda)).toBe(true);
    expect(canManageProjects(feby)).toBe(false);
    expect(canManageProjects(sinta)).toBe(false);
    expect(canManageProjects(null)).toBe(false);
  });
});
