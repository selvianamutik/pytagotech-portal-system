import { dashboardSnapshot } from "@/mocks/dashboard";
import type { DashboardSnapshot } from "@/types/dashboard";
import type { ServiceResult } from "@/services/result";

export async function getDashboardSnapshot(): Promise<ServiceResult<DashboardSnapshot>> {
  return {
    data: dashboardSnapshot,
    error: null,
  };
}
