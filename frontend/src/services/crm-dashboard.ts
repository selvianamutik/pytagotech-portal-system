import { listLeads } from "@/services/leads";
import type { ServiceResult } from "@/services/result";

/**
 * Dashboard CRM (US-013, FR-10): KPI penjualan otomatis dari database lead.
 * Definisi (ditulis juga di tooltip UI):
 * - Total Database Lead: seluruh lead (semua waktu).
 * - Total Outreach: lead dengan tanggal hubungi dalam periode.
 * - Status (New/Follow Up/Interested/Closing/Lost): subset Outreach per status.
 * - Interest Rate = Interested ÷ Outreach; Closing Rate = Closing ÷ Outreach.
 * Fase 2: agregasi SQL di database.
 */

export type DashboardPeriodMode = "daily" | "monthly" | "custom";

export interface DashboardPeriod {
  mode: DashboardPeriodMode;
  /** YYYY-MM-DD, wajib bila mode custom. */
  from?: string;
  to?: string;
}

export interface PeriodRange {
  from: string;
  to: string;
  label: string;
}

export interface CrmKpi {
  totalLeads: number;
  outreach: number;
  newCount: number;
  followUp: number;
  interested: number;
  closing: number;
  lost: number;
  interestRate: number;
  closingRate: number;
}

export interface PicPerformance {
  picName: string;
  handled: number;
  contacted: number;
  followUp: number;
  interest: number;
  notInterested: number;
  lost: number;
  closing: number;
}

export interface CrmDashboardData {
  range: PeriodRange;
  kpi: CrmKpi;
  perPic: PicPerformance[];
}

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Selesaikan periode menjadi rentang tanggal inklusif + label. */
export function resolvePeriod(period: DashboardPeriod): PeriodRange {
  const today = todayWib();
  if (period.mode === "daily") {
    return { from: today, to: today, label: "Harian" };
  }
  if (period.mode === "monthly") {
    const month = today.slice(0, 7);
    const lastDay = new Date(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)),
      0
    ).getDate();
    return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}`, label: "Bulanan" };
  }
  const from = period.from ?? today;
  const to = period.to ?? today;
  return {
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    label: "Kustom",
  };
}

export async function getCrmDashboard(
  period: DashboardPeriod
): Promise<ServiceResult<CrmDashboardData>> {
  const range = resolvePeriod(period);
  const { data: leads } = await listLeads();
  const all = leads ?? [];
  const outreach = all.filter(
    (lead) => lead.contactDate >= range.from && lead.contactDate <= range.to
  );

  const countStatus = (status: string) =>
    outreach.filter((lead) => lead.status === status).length;

  const interested = countStatus("Interest");
  const closing = countStatus("Closing");
  const kpi: CrmKpi = {
    totalLeads: all.length,
    outreach: outreach.length,
    newCount: countStatus("New"),
    followUp: countStatus("Follow Up"),
    interested,
    closing,
    lost: countStatus("Lost"),
    interestRate: outreach.length > 0 ? interested / outreach.length : 0,
    closingRate: outreach.length > 0 ? closing / outreach.length : 0,
  };

  const picNames = [...new Set(outreach.map((lead) => lead.picName))].sort((a, b) =>
    a.localeCompare(b)
  );
  const perPic: PicPerformance[] = picNames.map((picName) => {
    const rows = outreach.filter((lead) => lead.picName === picName);
    const count = (status: string) => rows.filter((lead) => lead.status === status).length;
    return {
      picName,
      handled: rows.length,
      contacted: count("Contacted"),
      followUp: count("Follow Up"),
      interest: count("Interest"),
      notInterested: count("Not Interested"),
      lost: count("Lost"),
      closing: count("Closing"),
    };
  });

  return { data: { range, kpi, perPic }, error: null };
}
