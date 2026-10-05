import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PORTAL_ROLES } from "@/types/auth";

/**
 * POST /api/admin/users — buat user portal baru (US-002, FR-1).
 * Hanya Super Admin. Membuat akun Auth (terkonfirmasi) + baris profil
 * (via trigger `handle_new_user`) + role awal, lalu pemanggil mengarahkan
 * user memakai "Lupa kata sandi" untuk mengatur kata sandinya sendiri.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; roles?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const roles = Array.isArray(body.roles) ? body.roles : [];

  if (name.length === 0) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Format email tidak valid." },
      { status: 400 }
    );
  }
  if (
    roles.length === 0 ||
    !roles.every(
      (role): role is (typeof PORTAL_ROLES)[number] =>
        typeof role === "string" &&
        (PORTAL_ROLES as readonly string[]).includes(role)
    )
  ) {
    return NextResponse.json(
      { error: "Pilih minimal satu role yang dikenal." },
      { status: 400 }
    );
  }

  // Otorisasi: penelepon harus Super Admin (cek role milik sendiri —
  // RLS user_roles mengizinkan setiap user membaca barisnya sendiri).
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) {
    return NextResponse.json({ error: "Perlu masuk terlebih dahulu." }, { status: 401 });
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
      { error: "Hanya Super Admin yang dapat membuat user." },
      { status: 403 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Layanan admin belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: `${randomUUID()}-${randomUUID()}`,
      email_confirm: true,
      user_metadata: { name },
    });
  if (createError || !created.user) {
    const duplicate = /already|registered|exists|duplicate/i.test(
      createError?.message ?? ""
    );
    return NextResponse.json(
      { error: duplicate ? "Email sudah digunakan user lain." : "Gagal membuat user." },
      { status: duplicate ? 409 : 500 }
    );
  }

  // Trigger handle_new_user membuat profil; pastikan nama sesuai input.
  await admin.from("profiles").upsert(
    { id: created.user.id, email, name },
    { onConflict: "id" }
  );
  const { error: rolesError } = await admin.from("user_roles").insert(
    roles.map((role) => ({ user_id: created.user.id, role_name: role }))
  );
  if (rolesError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Gagal menetapkan role user." },
      { status: 500 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, email, is_active, created_at")
    .eq("id", created.user.id)
    .single();

  return NextResponse.json(
    {
      data: {
        id: created.user.id,
        name: (profile as { name?: string } | null)?.name ?? name,
        email,
        roles,
        isActive: true,
        createdAt:
          (profile as { created_at?: string } | null)?.created_at ??
          new Date().toISOString(),
      },
    },
    { status: 201 }
  );
}
