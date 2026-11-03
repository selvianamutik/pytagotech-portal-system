import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardSnapshot } from "@/services/dashboard";
import { createSupabaseFake, seedCrmFake } from "@/test/supabase-fake";

const state = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createSupabaseFake> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    state.fake ??= createSupabaseFake(seedCrmFake());
    return (state.fake as unknown as { client: unknown }).client;
  },
}));

function seedWithSession() {
  return createSupabaseFake({
    ...seedCrmFake(),
    profiles: [
      {
        id: "user-1",
        name: "Dinda Prameswari",
        email: "dinda@pytagotech.test",
        is_active: true,
        created_at: "2026-09-01T00:00:00Z",
      },
    ],
    userRoles: [
      { user_id: "user-1", role_name: "Super Admin" },
      { user_id: "user-1", role_name: "Executive / Leader" },
    ],
    sessionUserId: "user-1",
  });
}

beforeEach(() => {
  state.fake = seedWithSession();
});

describe("getDashboardSnapshot", () => {
  it("membaca currentUser dari sesi Supabase sisi server", async () => {
    const result = await getDashboardSnapshot();

    expect(result.error).toBeNull();
    expect(result.data?.currentUser.name).toBe("Dinda Prameswari");
    expect(result.data?.currentUser.email).toBe("dinda@pytagotech.test");
    expect(result.data?.currentUser.roles).toEqual(
      expect.arrayContaining(["Super Admin", "Executive / Leader"])
    );
  });

  it("menyajikan navigasi statis dan rangkuman dari tabel nyata", async () => {
    const result = await getDashboardSnapshot();

    expect(result.data?.navigation.length).toBeGreaterThan(0);
    expect(result.data?.metrics).toHaveLength(4);
    // Work queue berisi lead follow-up dari seed (display ID seperti LEAD-001).
    expect(result.data?.workQueue.some((item) => /^[A-Z]+-\d+/.test(item.id))).toBe(true);
  });

  it("mengembalikan error saat sesi tidak ada", async () => {
    state.fake = createSupabaseFake({ ...seedCrmFake(), profiles: [], userRoles: [] });
    const result = await getDashboardSnapshot();

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});