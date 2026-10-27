import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AuditLogViewer } from "@/components/pengaturan/audit-log-viewer";
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
    ],
  }) as unknown as typeof fake;
});

describe("AuditLogViewer", () => {
  it("menampilkan entri + filter tanpa aksi ubah/hapus", async () => {
    render(<AuditLogViewer />);

    expect(await screen.findByText("Dinda")).toBeDefined();
    expect(screen.getAllByText("leads").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: /hapus|ubah/i })).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Nama aktor..."), {
      target: { value: "tak-ada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cari" }));
    expect(await screen.findByText(/belum ada entri/i)).toBeDefined();
  });
});
