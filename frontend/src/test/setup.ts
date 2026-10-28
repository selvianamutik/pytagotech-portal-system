import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

import { createSupabaseFake, seedCrmFake } from "./supabase-fake";

/**
 * Fake Supabase global untuk unit test service/komponen.
 *
 * Test yang membutuhkan seed khusus tetap boleh me-mock
 * `@/lib/supabase/client` sendiri; mock per-file akan menggantikan fake ini.
 * Seed bawaan berisi lead CRM, tim/PIC, dan master data inti agar test
 * modul CRM tidak perlu menyiapkan database berulang kali.
 */
const state = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createSupabaseFake> | null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    state.fake ??= createSupabaseFake(seedCrmFake());
    return state.fake.client;
  },
}));

beforeEach(() => {
  state.fake = createSupabaseFake(seedCrmFake());
});
