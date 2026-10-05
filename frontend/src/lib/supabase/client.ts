// Supabase client untuk dipakai di sisi browser (client components)
// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Kunci publishable baru (sb_publishable_...) dengan fallback ke nama lama ANON_KEY
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseKey);
}
