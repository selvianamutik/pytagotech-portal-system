import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/reset-data — kembalikan data demo ke snapshot UAT (US-044).
 * Hanya Super Admin. Memanggil RPC `public.reset_demo_data()` lewat client
 * sesi pemanggil (bukan service role) agar `auth.uid()` = Super Admin sehingga
 * guard di dalam fungsi lolos. Fungsi bersifat SECURITY DEFINER dan TRUNCATE
 * tabel operasional lalu mengisi ulang seed.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) {
    return NextResponse.json(
      { error: "Perlu masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_name")
    .eq("user_id", caller.id);
  const isSuperAdmin = ((callerRoles ?? []) as { role_name: string }[]).some(
    (row) => row.role_name === "Super Admin"
  );
  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mereset data demo." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase.rpc("reset_demo_data");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { data: { message: (data as string) ?? "Data demo dikembalikan." } },
    { status: 200 }
  );
}