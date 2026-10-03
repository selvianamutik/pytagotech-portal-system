import { dashboardSnapshot } from "@/mocks/dashboard";
import type { DashboardSnapshot } from "@/types/dashboard";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export async function getDashboardSnapshot(): Promise<ServiceResult<DashboardSnapshot>> {
  return {
    data: dashboardSnapshot,
    error: null,
  };
}
