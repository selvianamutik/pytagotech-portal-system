// Next.js 16: file `proxy.ts` adalah pengganti `middleware.ts`
// (nama `middleware` sudah deprecated). Fungsi ini me-refresh session
// Supabase via cookies dan mengarahkan alur auth dasar (US-002 backend):
// tamu → /login, user login di /login → beranda.
// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/login" || pathname.startsWith("/auth/");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    // Mode password-baru pasca-tautan reset butuh sesi recovery yang aktif.
    if (request.nextUrl.searchParams.get("recovery") === "1") {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali yang diawali:
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico (favicon)
     * Silakan ubah pola ini bila perlu.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
