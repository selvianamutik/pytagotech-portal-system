// Helper middleware/proxy Supabase untuk Next.js App Router.
// Me-refresh session (access/refresh token) lewat cookies dan mengembalikan
// klaim user agar proxy dapat mengatur redirect auth (US-002 backend).
// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Kunci publishable baru (sb_publishable_...) dengan fallback ke nama lama ANON_KEY
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Penting: jangan hapus — me-refresh token bila kedaluwarsa.
  // getClaims() memverifikasi JWT secara lokal (ringan, tanpa round-trip
  // ke Auth server). Pakai getUser() hanya bila perlu mendeteksi revokasi
  // session sisi server.
  const { data } = await supabase.auth.getClaims();

  return { response: supabaseResponse, user: data?.claims ?? null };
}
