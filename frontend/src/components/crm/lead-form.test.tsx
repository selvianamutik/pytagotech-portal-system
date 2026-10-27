import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { LeadForm } from "@/components/crm/lead-form";
import { createSupabaseFake } from "@/test/supabase-fake";
import type { FakeDb } from "@/test/supabase-fake";

let fake: { db: FakeDb; client: unknown };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => (fake as { client: unknown }).client,
}));

beforeEach(() => {
  fake = createSupabaseFake({
    masterOptions: [
      { category: "industry", value: "Energi", is_active: true },
      { category: "lead_status", value: "Prospek", is_active: true },
    ],
  }) as unknown as typeof fake;
});

describe("LeadForm — dropdown master", () => {
  it("menampilkan opsi industri dan status dari master data", async () => {
    render(
      <LeadForm
        open
        onOpenChange={() => {}}
        initial={null}
        picNames={["Nabila"]}
        onSaved={() => {}}
      />
    );

    expect(await screen.findByRole("option", { name: "Energi" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Prospek" })).toBeDefined();
  });
});
