import { beforeEach, describe, expect, it } from "vitest";

import { listAudit, resetMockAudit } from "@/services/audit";
import { assignLeadPIC, getLead, resetMockLeads } from "@/services/leads";

const actor = { id: "USR-001", name: "Dinda Prameswari" };

beforeEach(() => {
  resetMockLeads();
  resetMockAudit();
});

describe("assignLeadPIC", () => {
  it("menetapkan PIC ke banyak lead sekaligus", async () => {
    const result = await assignLeadPIC(["LEAD-001", "LEAD-003"], "Fira", actor);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect((await getLead("LEAD-001")).data?.picName).toBe("Fira");
    expect((await getLead("LEAD-003")).data?.picName).toBe("Fira");
  });

  it("mencatat setiap perubahan PIC di audit trail", async () => {
    await assignLeadPIC(["LEAD-001", "LEAD-004"], "Fira", actor);

    const audit = await listAudit();
    const picChanges = (audit.data ?? []).filter(
      (entry) => entry.action === "lead.assign-pic"
    );
    expect(picChanges).toHaveLength(2);
    const first = picChanges.find((entry) => entry.entityId === "LEAD-001");
    expect(first?.oldValue).toBe("Feby");
    expect(first?.newValue).toBe("Fira");
    expect(first?.actorName).toBe("Dinda Prameswari");
  });

  it("tidak mencatat audit bila PIC tidak berubah", async () => {
    await assignLeadPIC(["LEAD-001"], "Feby", actor);

    expect((await listAudit()).data).toHaveLength(0);
  });

  it("menolak PIC asing, daftar kosong, dan id tak dikenal", async () => {
    expect((await assignLeadPIC(["LEAD-001"], "Hantu", actor)).error).toMatch(/PIC/);
    expect((await assignLeadPIC([], "Feby", actor)).error).toMatch(/minimal satu/);
    expect((await assignLeadPIC(["LEAD-999"], "Feby", actor)).error).toMatch(
      /LEAD-999/
    );
  });
});
