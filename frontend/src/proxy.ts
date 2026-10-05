// Next.js 16: file `proxy.ts` adalah pengganti `middleware.ts`
// (nama `middleware` sudah deprecated). Fungsi ini berjalan sebelum
// request selesai untuk me-refresh session Supabase via cookies.
// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
