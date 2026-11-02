import { beforeEach, describe, expect, it } from "vitest";

import { resetMockClients } from "@/services/clients";
import { resetMockDeals } from "@/services/deals";
import { transitionDealStatus } from "@/services/deal-workflow";
import {
  createProjectFromHandover,
  findProjectByHandover,
  getProject,
  listProjectManagers,
  listProjects,
  resetMockProjects,
} from "@/services/projects";
import { resetMockTerms } from "@/services/deal-terms";
import { resetMockAudit } from "@/services/audit";
import { resetMockCollaboration } from "@/services/collaboration";

const pm = { id: "USR-003", name: "Raka", roles: ["Project Manager"] };

async function confirmHdv001() {
  await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: pm });
}

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
  resetMockAudit();
  resetMockCollaboration();
  resetMockProjects();
});

describe("listProjectManagers", () => {
  it("berisi PM dan Super Admin aktif", async () => {
    const pms = await listProjectManagers();

    expect(pms.data).toContain("Raka");
    expect(pms.data).toContain("Dinda Prameswari");
  });
});

describe("createProjectFromHandover", () => {
  it("menyalin data handover Dikonfirmasi", async () => {
    await confirmHdv001();
    const result = await createProjectFromHandover("HDV-001", {
      pmName: "Raka",
      startDate: "2026-10-05",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^PRJ-\d+$/);
    expect(result.data?.name).toBe(
      "Website Company Profile - PT Sinar Abadi Properti (PYT-2026-001)"
    );
    expect(result.data?.clientId).toBe("KLI-001");
    expect(result.data?.value).toBe(45000000);
    expect(result.data?.targetDate).toBe("2026-12-20");
    expect(result.data?.status).toBe("Planning");
    expect((await findProjectByHandover("HDV-001"))?.id).toBe(result.data?.id);
  });

  it("menolak handover belum Dikonfirmasi, ganda, PM asing, tanggal invalid", async () => {
    // HDV-002 masih Draft.
    expect(
      (await createProjectFromHandover("HDV-002", { pmName: "Raka", startDate: "2026-10-05" })).error
    ).toMatch(/Dikonfirmasi/);

    await confirmHdv001();
    expect(
      (await createProjectFromHandover("HDV-001", { pmName: "Hantu", startDate: "2026-10-05" })).error
    ).toMatch(/PM/);
    expect(
      (await createProjectFromHandover("HDV-001", { pmName: "Raka", startDate: "2027-01-01" })).error
    ).toMatch(/melewati deadline/);

    await createProjectFromHandover("HDV-001", { pmName: "Raka", startDate: "2026-10-05" });
    expect(
      (await createProjectFromHandover("HDV-001", { pmName: "Raka", startDate: "2026-10-05" })).error
    ).toMatch(/sudah dijadikan proyek/);
  });

  it("relasi dua arah terbaca dari getProject dan listProjects", async () => {
    await confirmHdv001();
    const created = await createProjectFromHandover("HDV-001", {
      pmName: "Raka",
      startDate: "2026-10-05",
    });

    const detail = await getProject(created.data!.id);
    expect(detail.data?.handoverCode).toBe("PYT-2026-001");
    expect(detail.data?.clientName).toBe("PT Sinar Abadi Properti");
    expect((await listProjects()).data).toHaveLength(3);
    expect((await getProject("PRJ-999")).error).toBe("Proyek tidak ditemukan.");
  });
});
