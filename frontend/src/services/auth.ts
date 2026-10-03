import { mockUsers } from "@/mocks/auth";
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
 * Fase 1: mock in-memory dengan signature yang meniru Supabase Auth
 * (`signInWithPassword`, `signOut`, `resetPasswordForEmail`, tabel `profiles`).
 * Komponen HANYA boleh memanggil fungsi dari file ini.
 */

const MIN_PASSWORD_LENGTH = 8;

let userStore: PortalUser[] = structuredClone(mockUsers);
let sessionStore: AuthSession | null = null;

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockAuth(): void {
  userStore = structuredClone(mockUsers);
  sessionStore = null;
}

function sessionFor(user: PortalUser): AuthSession {
  return {
    user: { ...user, roles: [...user.roles] },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getSession(): Promise<ServiceResult<AuthSession>> {
  return { data: sessionStore, error: null };
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

  const user = userStore.find((candidate) => candidate.email === email);
  // Pesan generik agar tidak membocorkan email mana yang terdaftar.
  if (!user) {
    return { data: null, error: "Email atau kata sandi salah." };
  }
  if (!user.isActive) {
    return {
      data: null,
      error: "Akun dinonaktifkan. Hubungi Super Admin.",
    };
  }

  // Fase 1 (mock): kecocokan password diverifikasi Supabase Auth di Fase 2.
  sessionStore = sessionFor(user);
  return { data: sessionStore, error: null };
}

export async function logout(): Promise<ServiceResult<true>> {
  sessionStore = null;
  return { data: true, error: null };
}

export async function requestPasswordReset(
  email: string
): Promise<ServiceResult<string>> {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return { data: null, error: "Format email tidak valid." };
  }
  const user = userStore.find((candidate) => candidate.email === normalized);
  if (!user) {
    return { data: null, error: "Email tidak terdaftar di portal." };
  }
  // Fase 2: diganti `supabase.auth.resetPasswordForEmail`.
  return {
    data: `Tautan reset kata sandi dikirim ke ${normalized}. (mock — email asli dikirim via Supabase Auth di Fase 2)`,
    error: null,
  };
}

export async function listUsers(): Promise<ServiceResult<PortalUser[]>> {
  return {
    data: userStore.map((user) => ({ ...user, roles: [...user.roles] })),
    error: null,
  };
}

function isValidRole(role: string): role is UserRole {
  return (PORTAL_ROLES as readonly string[]).includes(role);
}

/** User aktif terakhir dengan role Super Admin — tidak boleh hilang. */
function isLastActiveSuperAdmin(targetId: string): boolean {
  const others = userStore.filter(
    (user) =>
      user.id !== targetId && user.isActive && user.roles.includes("Super Admin")
  );
  return others.length === 0;
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
  if (userStore.some((user) => user.email === email)) {
    return { data: null, error: "Email sudah digunakan user lain." };
  }

  const nextNumber = userStore.length + 1;
  const user: PortalUser = {
    id: `USR-${String(nextNumber).padStart(3, "0")}`,
    name,
    email,
    roles: [...input.roles],
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  userStore.push(user);
  return { data: { ...user, roles: [...user.roles] }, error: null };
}

export async function updateUserRoles(
  userId: string,
  roles: UserRole[]
): Promise<ServiceResult<PortalUser>> {
  const user = userStore.find((candidate) => candidate.id === userId);
  if (!user) {
    return { data: null, error: "User tidak ditemukan." };
  }
  if (roles.length === 0) {
    return { data: null, error: "User harus memiliki minimal satu role." };
  }
  if (!roles.every(isValidRole)) {
    return { data: null, error: "Terdapat role yang tidak dikenal." };
  }
  if (
    user.isActive &&
    user.roles.includes("Super Admin") &&
    !roles.includes("Super Admin") &&
    isLastActiveSuperAdmin(userId)
  ) {
    return {
      data: null,
      error: "Tidak dapat mencabut Super Admin terakhir yang aktif.",
    };
  }
  user.roles = [...roles];
  return { data: { ...user, roles: [...user.roles] }, error: null };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
  actorId?: string
): Promise<ServiceResult<PortalUser>> {
  const user = userStore.find((candidate) => candidate.id === userId);
  if (!user) {
    return { data: null, error: "User tidak ditemukan." };
  }
  if (!isActive && actorId === userId) {
    return {
      data: null,
      error: "Tidak dapat menonaktifkan akun sendiri.",
    };
  }
  if (
    !isActive &&
    user.roles.includes("Super Admin") &&
    isLastActiveSuperAdmin(userId)
  ) {
    return {
      data: null,
      error: "Tidak dapat menonaktifkan Super Admin terakhir yang aktif.",
    };
  }
  user.isActive = isActive;
  return { data: { ...user, roles: [...user.roles] }, error: null };
}
