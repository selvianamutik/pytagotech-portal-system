import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validators";
import type {
  AuthSession,
  CreateUserInput,
  LoginInput,
  PortalUser,
  UserRole,
} from "@/types/auth";
import { PORTAL_ROLES } from "@/types/auth";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan akses data autentikasi & user (US-002, FR-1).
 * Implementasi Supabase Auth + tabel `profiles`/`user_roles` (RLS US-003).
 * Komponen HANYA boleh memanggil fungsi dari file ini.
 */

const MIN_PASSWORD_LENGTH = 8;

type BrowserSupabase = ReturnType<typeof createClient>;

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface UserRoleRow {
  user_id: string;
  role_name: string;
}

function isValidRole(role: string): role is UserRole {
  return (PORTAL_ROLES as readonly string[]).includes(role);
}

function toPortalUser(
  profile: ProfileRow,
  roles: UserRoleRow[]
): PortalUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    roles: roles
      .filter((row) => row.user_id === profile.id && isValidRole(row.role_name))
      .map((row) => row.role_name as UserRole),
    isActive: profile.is_active,
    createdAt: profile.created_at,
  };
}

async function fetchPortalUser(
  supabase: BrowserSupabase,
  authUserId: string
): Promise<PortalUser | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, is_active, created_at")
    .eq("id", authUserId)
    .single();
  if (profileError || !profile) {
    return null;
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role_name")
    .eq("user_id", authUserId);
  if (rolesError) {
    return null;
  }

  return toPortalUser(profile as ProfileRow, (roles ?? []) as UserRoleRow[]);
}

/** ID user aktif ber-role Super Admin — dipakai guard proteksi admin terakhir. */
async function fetchActiveSuperAdminIds(
  supabase: BrowserSupabase
): Promise<string[] | null> {
  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role_name", "Super Admin");
  if (rolesError || !roleRows) {
    return null;
  }
  const ids = (roleRows as { user_id: string }[]).map((row) => row.user_id);
  if (ids.length === 0) {
    return [];
  }
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .in("id", ids)
    .eq("is_active", true);
  if (profilesError || !profiles) {
    return null;
  }
  return (profiles as { id: string }[]).map((row) => row.id);
}

function sessionResult(
  user: PortalUser,
  expiresAt: string | null
): ServiceResult<AuthSession> {
  return {
    data: {
      user,
      expiresAt:
        expiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    error: null,
  };
}

export async function getSession(): Promise<ServiceResult<AuthSession>> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: null };
    }

    const user = await fetchPortalUser(supabase, session.user.id);
    if (!user) {
      return { data: null, error: null };
    }

    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;
    return sessionResult(user, expiresAt);
  } catch {
    // Gagal baca sesi (mis. env belum dikonfigurasi) = anggap belum masuk.
    return { data: null, error: null };
  }
}

export async function login(
  input: LoginInput
): Promise<ServiceResult<AuthSession>> {
  const email = input.email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return { data: null, error: "Format email tidak valid." };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      data: null,
      error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  // Pesan generik agar tidak membocorkan email mana yang terdaftar.
  if (error || !data.session) {
    return { data: null, error: "Email atau kata sandi salah." };
  }

  const user = await fetchPortalUser(supabase, data.session.user.id);
  if (!user) {
    await supabase.auth.signOut();
    return {
      data: null,
      error: "Profil portal belum tersedia. Hubungi Super Admin.",
    };
  }
  if (!user.isActive) {
    await supabase.auth.signOut();
    return {
      data: null,
      error: "Akun dinonaktifkan. Hubungi Super Admin.",
    };
  }

  const expiresAt = data.session.expires_at
    ? new Date(data.session.expires_at * 1000).toISOString()
    : null;
  return sessionResult(user, expiresAt);
}

export async function logout(): Promise<ServiceResult<true>> {
  await createClient().auth.signOut();
  return { data: true, error: null };
}

/**
 * Atur kata sandi baru dari sesi recovery (US-002).
 * Dipakai mode "password baru" di /login?recovery=1 setelah tautan email.
 */
export async function updatePassword(
  newPassword: string
): Promise<ServiceResult<true>> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      data: null,
      error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }
  const { error } = await createClient().auth.updateUser({
    password: newPassword,
  });
  if (error) {
    return {
      data: null,
      error: "Gagal memperbarui kata sandi. Minta tautan reset baru.",
    };
  }
  return { data: true, error: null };
}

export async function requestPasswordReset(
  email: string
): Promise<ServiceResult<string>> {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return { data: null, error: "Format email tidak valid." };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  // Tautan email ditukar sesi di /auth/confirm, lalu ke mode password-baru.
  const redirectTo = appUrl
    ? `${appUrl}/auth/confirm?next=${encodeURIComponent("/login?recovery=1")}`
    : undefined;
  const { error } = await createClient().auth.resetPasswordForEmail(
    normalized,
    redirectTo ? { redirectTo } : undefined
  );
  if (error) {
    return { data: null, error: "Gagal mengirim tautan reset. Coba lagi." };
  }
  // Selalu sukses agar tidak membocorkan email mana yang terdaftar.
  return {
    data: `Jika ${normalized} terdaftar, tautan reset kata sandi telah dikirim.`,
    error: null,
  };
}

export async function listUsers(): Promise<ServiceResult<PortalUser[]>> {
  const supabase = createClient();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, email, is_active, created_at")
    .order("name");
  if (profilesError || !profiles) {
    return { data: null, error: "Gagal memuat daftar user." };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role_name");
  if (rolesError || !roles) {
    return { data: null, error: "Gagal memuat daftar user." };
  }

  const roleRows = roles as UserRoleRow[];
  return {
    data: (profiles as ProfileRow[]).map((profile) =>
      toPortalUser(profile, roleRows)
    ),
    error: null,
  };
}

export async function createUser(
  input: CreateUserInput
): Promise<ServiceResult<PortalUser>> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length === 0) {
    return { data: null, error: "Nama wajib diisi." };
  }
  if (!isValidEmail(email)) {
    return { data: null, error: "Format email tidak valid." };
  }
  if (input.roles.length === 0) {
    return { data: null, error: "Pilih minimal satu role." };
  }
  if (!input.roles.every(isValidRole)) {
    return { data: null, error: "Terdapat role yang tidak dikenal." };
  }

  // Pembuatan akun Auth memakai service_role → wajib lewat Route Handler
  // agar kunci service tidak masuk bundle browser.
  let response: Response;
  try {
    response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, roles: input.roles }),
    });
  } catch {
    return { data: null, error: "Gagal membuat user. Coba lagi." };
  }

  const payload = (await response.json()) as {
    data?: PortalUser;
    error?: string;
  };
  if (!response.ok || !payload.data) {
    return {
      data: null,
      error: payload.error ?? "Gagal membuat user.",
    };
  }
  return { data: payload.data, error: null };
}

export async function updateUserRoles(
  userId: string,
  roles: UserRole[]
): Promise<ServiceResult<PortalUser>> {
  if (roles.length === 0) {
    return { data: null, error: "User harus memiliki minimal satu role." };
  }
  if (!roles.every(isValidRole)) {
    return { data: null, error: "Terdapat role yang tidak dikenal." };
  }

  const supabase = createClient();
  const { data: currentRoles } = await supabase
    .from("user_roles")
    .select("role_name")
    .eq("user_id", userId);
  const currentlySuperAdmin = ((currentRoles ?? []) as { role_name: string }[]).some(
    (row) => row.role_name === "Super Admin"
  );

  if (currentlySuperAdmin && !roles.includes("Super Admin")) {
    const adminIds = await fetchActiveSuperAdminIds(supabase);
    if (adminIds === null) {
      return { data: null, error: "Gagal memeriksa proteksi Super Admin." };
    }
    if (adminIds.length <= 1 && adminIds.includes(userId)) {
      return {
        data: null,
        error: "Tidak dapat mencabut Super Admin terakhir yang aktif.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    return { data: null, error: "Gagal mengubah role." };
  }

  const { error: insertError } = await supabase.from("user_roles").insert(
    roles.map((role) => ({ user_id: userId, role_name: role }))
  );
  if (insertError) {
    return { data: null, error: "Gagal mengubah role." };
  }

  const user = await fetchPortalUser(supabase, userId);
  if (!user) {
    return { data: null, error: "User tidak ditemukan." };
  }
  return { data: user, error: null };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
  actorId?: string
): Promise<ServiceResult<PortalUser>> {
  if (!isActive && actorId === userId) {
    return {
      data: null,
      error: "Tidak dapat menonaktifkan akun sendiri.",
    };
  }

  const supabase = createClient();
  if (!isActive) {
    const { data: currentRoles } = await supabase
      .from("user_roles")
      .select("role_name")
      .eq("user_id", userId);
    const isSuperAdmin = ((currentRoles ?? []) as { role_name: string }[]).some(
      (row) => row.role_name === "Super Admin"
    );
    if (isSuperAdmin) {
      const adminIds = await fetchActiveSuperAdminIds(supabase);
      if (adminIds === null) {
        return { data: null, error: "Gagal memeriksa proteksi Super Admin." };
      }
      if (adminIds.length <= 1 && adminIds.includes(userId)) {
        return {
          data: null,
          error: "Tidak dapat menonaktifkan Super Admin terakhir yang aktif.",
        };
      }
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (updateError) {
    return { data: null, error: "Gagal mengubah status user." };
  }

  const user = await fetchPortalUser(supabase, userId);
  if (!user) {
    return { data: null, error: "User tidak ditemukan." };
  }
  return { data: user, error: null };
}
