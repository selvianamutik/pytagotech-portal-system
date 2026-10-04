import type { AccountGrowth, GrowthInput } from "@/types/growth";
import { isSosmedPlatform } from "@/types/sosmed";
import type { ServiceResult } from "@/services/result";

/** Lapisan pertumbuhan akun bulanan (US-036). Satu baris per platform/bulan. */

let growthStore: AccountGrowth[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockGrowth(): void {
  growthStore = [
    {
      id: "GRO-001",
      platform: "Instagram",
      month: "2026-08",
      followersStart: 10000,
      followersGained: 800,
      unfollows: 200,
      reach: 120000,
      profileVisits: 5000,
    },
    {
      id: "GRO-002",
      platform: "Instagram",
      month: "2026-09",
      followersStart: 10600,
      followersGained: 900,
      unfollows: 150,
      reach: 140000,
      profileVisits: 6200,
    },
  ];
}

resetMockGrowth();

function validateGrowthInput(input: GrowthInput): string | null {
  if (!isSosmedPlatform(input.platform)) {
    return "Platform tidak dikenal.";
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) {
    return "Bulan harus format YYYY-MM.";
  }
  const fields: [string, number][] = [
    ["Followers Awal", input.followersStart],
    ["Followers Masuk", input.followersGained],
    ["Unfollows", input.unfollows],
    ["Account Reach", input.reach],
    ["Profile Visits", input.profileVisits],
  ];
  for (const [label, value] of fields) {
    if (!Number.isInteger(value) || value < 0) {
      return `${label} harus bilangan bulat ≥ 0.`;
    }
  }
  return null;
}

export async function listGrowth(
  platform?: string
): Promise<ServiceResult<AccountGrowth[]>> {
  const items = platform
    ? growthStore.filter((entry) => entry.platform === platform)
    : growthStore;
  return {
    data: [...items]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((entry) => ({ ...entry })),
    error: null,
  };
}

export async function recordGrowth(
  input: GrowthInput
): Promise<ServiceResult<AccountGrowth>> {
  const validationError = validateGrowthInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  if (
    growthStore.some(
      (entry) => entry.platform === input.platform && entry.month === input.month
    )
  ) {
    return { data: null, error: "Data bulan ini untuk platform tersebut sudah ada." };
  }
  const entry: AccountGrowth = {
    id: `GRO-${String(growthStore.length + 1).padStart(3, "0")}`,
    ...input,
  };
  growthStore.push(entry);
  return { data: { ...entry }, error: null };
}
