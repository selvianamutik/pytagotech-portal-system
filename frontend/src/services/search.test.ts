import { beforeEach, describe, expect, it } from "vitest";

import { getMyWork, globalSearch } from "@/services/search";
import { resetMockClients } from "@/services/clients";
import { resetMockMaterials } from "@/services/materials";
import { resetMockProjects } from "@/services/projects";
import { mockUsers } from "@/mocks/auth";

beforeEach(() => {
  resetMockClients();
  resetMockProjects();
  resetMockMaterials();
});

describe("globalSearch", () => {
  it("menemukan lead, klien, dan materi lintas modul", async () => {
    const aruna = await globalSearch("aruna", null);

    expect(aruna.error).toBeNull();
    expect(aruna.data?.some((hit) => hit.kind === "lead")).toBe(true);

    const sinar = await globalSearch("sinar", null);
    expect(sinar.data?.some((hit) => hit.kind === "klien")).toBe(true);

    const carousel = await globalSearch("carousel", null);
    expect(carousel.data?.[0]).toMatchObject({ kind: "materi", href: "/sosmed/materi/MAT-0018" });
  });

  it("butuh minimal 2 huruf", async () => {
    expect((await globalSearch("a", null)).data).toHaveLength(0);
  });
});

describe("getMyWork", () => {
  it("kosong tanpa user; follow-up overdue untuk PIC", async () => {
    expect((await getMyWork(null)).data?.tasks).toHaveLength(0);

    const feby = mockUsers.find((user) => user.id === "USR-002") ?? null;
    const work = await getMyWork(feby);

    // LEAD-001 Follow Up + nextFollowUp lewat + PIC Feby.
    expect(work.data?.followUps.map((item) => item.id)).toContain("LEAD-001");
    // Feby bukan reviewer → reviews kosong; SLA: INT-002 belum dibalas.
    expect(work.data?.reviews).toHaveLength(0);
    expect(work.data?.sla.map((item) => item.id)).toContain("INT-002");
  });

  it("reviewer melihat materi Draf", async () => {
    const dinda = mockUsers.find((user) => user.id === "USR-001") ?? null;
    const work = await getMyWork(dinda);

    expect(work.data?.reviews.map((item) => item.id)).toContain("MAT-0018");
  });
});
