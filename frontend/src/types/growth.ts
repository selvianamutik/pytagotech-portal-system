/**
 * Kontrak pertumbuhan akun (US-036).
 * Net Growth = (Masuk − Unfollows) ÷ Awal × 100%.
 * Fase 1: mock; Fase 2: tabel `account_growth`.
 */
export interface AccountGrowth {
  id: string;
  platform: string;
  /** Bulan YYYY-MM. */
  month: string;
  followersStart: number;
  followersGained: number;
  unfollows: number;
  reach: number;
  profileVisits: number;
}

export interface GrowthInput {
  platform: string;
  month: string;
  followersStart: number;
  followersGained: number;
  unfollows: number;
  reach: number;
  profileVisits: number;
}

export function netGrowth(entry: {
  followersStart: number;
  followersGained: number;
  unfollows: number;
}): number {
  if (entry.followersStart <= 0) {
    return 0;
  }
  return ((entry.followersGained - entry.unfollows) / entry.followersStart) * 100;
}

export const NET_GROWTH_FORMULA = "Net Growth = (Masuk − Unfollows) ÷ Awal × 100%";
