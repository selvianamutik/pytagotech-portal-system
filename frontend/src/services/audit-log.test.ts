import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryAuditLogs } from "@/services/audit";
import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";

let fake: { db: FakeDb; client: unknown };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => (fake as { client: unknown }).client,
}));

beforeEach(() => {
  fake = createSupabaseFake({
    auditLogs: [
      {
        id: "a1",
        actor_id: "u1",
        actor_name: "Dinda",
        action: "insert",
        entity_type: "leads",
        entity_id: "l1",
        old_value: null,
        new_value: { status: "New" },
        created_at: "2026-10-05T10:00:00+07:00",
      },
      {
        id: "a2",
        actor_id: "u2",
        actor_name: "Raka",
        action: "update",
        entity_type: "deals",
        entity_id: "d1",
        old_value: { status: "Draft" },
        new_value: { status: "Dikonfirmasi" },
        created_at: "2026-10-04T10:00:00+07:00",
      },
    ],
  }) as unknown as typeof fake;
});

describe("queryAuditLogs", () => {
  it("terbaru dulu dengan nilai JSON menjadi string", async () => {
    const result = await queryAuditLogs({});

    expect(result.error).toBeNull();
    expect(result.data?.map((entry) => entry.id)).toEqual(["a1", "a2"]);
    expect(result.data?.[0].newValue).toBe('{"status":"New"}');
    expect(result.data?.[1].oldValue).toBe('{"status":"Draft"}');
  });

  it("filter aktor, modul, dan rentang tanggal", async () => {
    const byActor = await queryAuditLogs({ actor: "din" });
    expect(byActor.data?.map((entry) => entry.id)).toEqual(["a1"]);

    const byModule = await queryAuditLogs({ entityType: "deals" });
    expect(byModule.data?.map((entry) => entry.id)).toEqual(["a2"]);

    const byDate = await queryAuditLogs({
      dateFrom: "2026-10-05",
      dateTo: "2026-10-05",
    });
    expect(byDate.data?.map((entry) => entry.id)).toEqual(["a1"]);
  });

  it("membatasi jumlah baris", async () => {
    const result = await queryAuditLogs({ limit: 1 });

    expect(result.data).toHaveLength(1);
  });
});
