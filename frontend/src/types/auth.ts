/**
 * Kontrak data autentikasi & manajemen user (US-002, FR-1).
 * Fase 1: diimplementasikan via mock (`@/mocks/auth`) dan `services/auth`.
 * Fase 3: implementasi Supabase Auth + tabel `profiles`/`user_roles` dengan
 * RLS (US-003); signature service dipertahankan.
 */

/** Daftar role kanonis sesuai PRD Bagian 3 (User Roles). */
export const PORTAL_ROLES = [
  "Super Admin",
  "Executive / Leader",
  "Sales / Marketing",
  "Project Manager",
  "Developer",
  "Social Media Specialist",
  "Graphic Designer / Video Editor / Copywriter",
] as const;

export type UserRole = (typeof PORTAL_ROLES)[number];

/** Profil user portal. Satu user dapat memiliki lebih dari satu role. */
export interface PortalUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  /** User nonaktif tidak bisa login dan disembunyikan dari penugasan. */
  isActive: boolean;
  createdAt: string;
}

/** Sesi login aktif (mock dari Supabase Auth session). */
export interface AuthSession {
  user: PortalUser;
  /** ISO 8601 UTC kedaluwarsa sesi. */
  expiresAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  roles: UserRole[];
}

/** Mengecek apakah user memiliki minimal satu dari role yang diizinkan. */
export function hasRole(user: PortalUser | null, allowed: UserRole[]): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  return user.roles.some((role) => allowed.includes(role));
}
