import { createClient as getSupabaseClient } from "@/lib/supabase/client";

/**
 * Menyisipkan baris proyek langsung ke fake Supabase untuk test service yang
 * butuh cakupan proyek di luar seed bawaan (`PRJ-001`/`PRJ-002`).
 *
 * Sengaja tidak memakai RPC handover agar tidak ikut membuat task template
 * dan backlog fitur yang mengacaukan skenario test.
 */
export async function seedProjectFixture(
  displayId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const suffix = displayId.replace(/^PRJ-/, "").toLowerCase();
  const client = getSupabaseClient() as unknown as {
    from: (table: string) => {
      insert: (
        row: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { error } = await client.from("projects").insert({
    id: `proj-fixture-${suffix}`,
    display_id: displayId,
    name: `Fixture ${displayId}`,
    code: `PYT-FIX-${suffix}`,
    client_id: "cli-2",
    pm_id: "tm-raka",
    start_date: "2026-09-01",
    target_date: "2026-12-31",
    value_idr: 1_000_000,
    status: "Planning",
    handover_id: `fixture-${suffix}`,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  });
  if (error) {
    throw new Error(error.message);
  }
  return displayId;
}
