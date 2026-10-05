import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { resolveBackLink } from "@/lib/back-link";

/**
 * GET /auth/confirm — tukar kode/token tautan email Auth (US-002, FR-1).
 * Dipakai template email (signup, ganti email, reset password) via
 * `redirectTo: <APP_URL>/auth/confirm?next=<tujuan>`.
 * Sukses → redirect ke `next` (path internal tervalidasi) DENGAN cookie sesi
 * hasil verifikasi; gagal → /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = resolveBackLink(
    searchParams.get("next") ?? undefined,
    "/",
    "Beranda"
  ).href;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Kumpulkan cookie sesi yang ditulis saat verifikasi agar bisa ditempel
  // ke respons redirect (NextResponse.redirect baru tidak membawa cookie).
  let pendingCookies: { name: string; value: string; options?: CookieOptions }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
      },
    },
  });

  let verified = false;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    verified = !error;
  }

  const code = searchParams.get("code");
  if (!verified && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const target =
    !isLocal && forwardedHost
      ? `https://${forwardedHost}${next}`
      : new URL(next, request.url);

  if (verified) {
    const redirect = NextResponse.redirect(target);
    for (const { name, value, options } of pendingCookies) {
      redirect.cookies.set(name, value, options);
    }
    return redirect;
  }

  return NextResponse.redirect(
    new URL("/auth/error?reason=tautan-kedaluwarsa", request.url)
  );
}
