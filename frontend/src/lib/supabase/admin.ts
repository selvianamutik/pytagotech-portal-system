import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client khusus server untuk operasi administratif.
 *
 * Service role bypasses RLS, jadi helper ini hanya boleh dipakai dari
 * Route Handler, Server Action, atau script backend yang tidak pernah masuk
 * ke bundle browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
