import { createClient as getSupabaseClient } from "@/lib/supabase/client";
import { loadMemberMaps } from "@/services/production-refs";
import { listFeatures, writeFeatureSchedule } from "@/services/features";
import { getProject } from "@/services/projects";
import type { ServiceResult } from "@/services/result";

/**
 * Penjadwalan fitur otomatis (US-024, FR-18).
 * Aturan (terdokumentasi di UI + API):
 * - Urutan: prioritas High → Medium → Low, lalu nama.
 * - Estimasi = hari-orang @8 jam; durasi kalender = ceil(estimasi × 8/kapasitas).
 * - Hari kerja: Senin–Jumat dikurangi hari libur terkonfigurasi.
 * - Tiap developer dikerjakan berurutan (satu fitur dalam satu waktu);
 *   developer berbeda paralel. Tanpa developer = terjadwal tanpa cek bentrok.
 * - Override manual wajib beralasan; bentrok (tumpang tindih developer
 *   yang sama) ditandai peringatan.
 *
 * Sumber data: `holidays` (Pengaturan), `developer_capacity`, dan `features`.
 */

export interface ScheduleSettings {
  /** YYYY-MM-DD hari libur (Sabtu/Minggu selalu libur). */
  holidays: string[];
  /** Kapasitas jam/hari per developer (default 8 bila tak diatur). */
  capacityHoursPerDay: Record<string, number>;
}

/** Backward-compat no-op untuk test runner. */
export function resetMockScheduling(): void {
  // Database-backed — pembersihan ditangani oleh fake Supabase per-test.
}

export async function getScheduleSettings(): Promise<ServiceResult<ScheduleSettings>> {
  const supabase = getSupabaseClient();
  const [holidaysResult, capacityResult, members] = await Promise.all([
    supabase.from("holidays").select("day, name").order("day", { ascending: true }),
    supabase.from("developer_capacity").select("developer_id, hours_per_day"),
    loadMemberMaps(),
  ]);
  const error =
    holidaysResult.error ?? capacityResult.error ?? members.error;
  if (error || !members.data) {
    return {
      data: null,
      error:
        (typeof error === "string" ? error : error?.message) ??
        "Gagal memuat pengaturan jadwal.",
    };
  }
  const holidays = new Set<string>();
  for (const row of (holidaysResult.data ?? []) as {
    day: string;
    name: string | null;
  }[]) {
    if (row.day && !Number.isNaN(Date.parse(row.day))) {
      holidays.add(row.day);
    }
  }
  const capacityHoursPerDay: Record<string, number> = {};
  for (const row of (capacityResult.data ?? []) as {
    developer_id: string;
    hours_per_day: number | string;
  }[]) {
    const name = members.data.nameById.get(row.developer_id);
    const hours = Number(row.hours_per_day);
    if (name && Number.isFinite(hours) && hours > 0) {
      capacityHoursPerDay[name] = hours;
    }
  }
  return {
    data: {
      holidays: [...holidays].sort(),
      capacityHoursPerDay,
    },
    error: null,
  };
}

export async function setScheduleSettings(
  settings: ScheduleSettings
): Promise<ServiceResult<ScheduleSettings>> {
  const holidays = [
    ...new Set(
      settings.holidays
        .filter((day) => !Number.isNaN(Date.parse(day)))
        .sort()
    ),
  ];
  const capacityNames = Object.keys(settings.capacityHoursPerDay);
  const members = await loadMemberMaps();
  if (members.error || !members.data) {
    return { data: null, error: members.error ?? "Gagal memuat data tim." };
  }

  const supabase = getSupabaseClient();
  const [holidayDelete, capacityDelete] = await Promise.all([
    supabase.from("holidays").delete().neq("day", ""),
    supabase.from("developer_capacity").delete().neq("developer_id", ""),
  ]);
  const deleteError = holidayDelete.error ?? capacityDelete.error;
  if (deleteError) {
    return { data: null, error: deleteError.message };
  }

  if (holidays.length > 0) {
    const { error } = await supabase
      .from("holidays")
      .insert(holidays.map((day) => ({ day, name: null })));
    if (error) {
      return { data: null, error: error.message };
    }
  }

  const capacityRows = capacityNames
    .map((name) => {
      const developerId = members.data!.idByName.get(name);
      const hours = settings.capacityHoursPerDay[name];
      if (!developerId || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
        return null;
      }
      return { developer_id: developerId, hours_per_day: Math.round(hours) };
    })
    .filter(
      (row): row is { developer_id: string; hours_per_day: number } =>
        row !== null
    );
  if (capacityRows.length > 0) {
    const { error } = await supabase
      .from("developer_capacity")
      .insert(capacityRows);
    if (error) {
      return { data: null, error: error.message };
    }
  }

  return getScheduleSettings();
}

export function isWorkday(dateIso: string, holidays: string[]): boolean {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  if (day === 0 || day === 6) {
    return false;
  }
  return !holidays.includes(dateIso);
}

export function addWorkdays(
  dateIso: string,
  days: number,
  holidays: string[]
): string {
  let current = dateIso;
  let added = 0;
  while (added < days) {
    current = shiftDate(current, 1);
    if (isWorkday(current, holidays)) {
      added += 1;
    }
  }
  return current;
}

function shiftDate(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Mundur ke hari kerja terdekat (untuk tanggal mulai yang jatuh di libur). */
export function nextWorkday(dateIso: string, holidays: string[]): string {
  let current = dateIso;
  while (!isWorkday(current, holidays)) {
    current = shiftDate(current, 1);
  }
  return current;
}

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export interface FeatureSchedule {
  featureId: string;
  featureName: string;
  developer: string;
  estimateDays: number;
  startDate: string;
  endDate: string;
  overridden: boolean;
  overrideReason: string | null;
  /** ID fitur lain yang bentrok (developer sama, rentang tumpang tindih). */
  conflictsWith: string[];
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Hitung jadwal seluruh fitur proyek. Urutan prioritas; durasi dari
 * estimasi × kapasitas; berurutan per developer.
 *
 * `holidays` berasal dari Pengaturan (US-041); bila tidak diberikan,
 * nilai tersimpan di tabel `holidays` dipakai.
 */
export async function scheduleProjectFeatures(
  projectId: string,
  options?: { holidays?: string[] }
): Promise<ServiceResult<FeatureSchedule[]>> {
  const [settingsResult, projectResult, featuresResult] = await Promise.all([
    getScheduleSettings(),
    getProject(projectId),
    listFeatures(projectId),
  ]);
  if (settingsResult.error || !settingsResult.data) {
    return {
      data: null,
      error: settingsResult.error ?? "Gagal memuat pengaturan jadwal.",
    };
  }
  const settings = settingsResult.data;
  const holidays = options?.holidays ?? settings.holidays;
  const project = projectResult.data;
  const features = featuresResult.data;
  if (!project) {
    return { data: null, error: "Proyek tidak ditemukan." };
  }
  const items = (features ?? []).slice().sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
      a.name.localeCompare(b.name)
  );

  const schedules = new Map<string, FeatureSchedule>();
  const developerCursor = new Map<string, string>();

  for (const feature of items) {
    const capacity = settings.capacityHoursPerDay[feature.developer] || 8;
    const durationDays = Math.max(
      1,
      Math.ceil((feature.estimateDays * 8) / capacity)
    );
    const lane = feature.developer || "(belum ditetapkan)";
    const laneStart = nextWorkday(
      developerCursor.get(lane) ?? project.project.startDate,
      holidays
    );
    const start = feature.scheduleOverride?.startDate ?? laneStart;
    const end =
      feature.scheduleOverride?.endDate ??
      addWorkdays(start, durationDays - 1, holidays);

    schedules.set(feature.id, {
      featureId: feature.id,
      featureName: feature.name,
      developer: feature.developer,
      estimateDays: feature.estimateDays,
      startDate: start,
      endDate: end,
      overridden: Boolean(feature.scheduleOverride),
      overrideReason: feature.scheduleOverride?.reason ?? null,
      conflictsWith: [],
    });
    // Lane maju hanya bila tidak dioverride (override bisa menumpuk → bentrok).
    if (!feature.scheduleOverride) {
      developerCursor.set(lane, shiftDate(end, 1));
    } else {
      developerCursor.set(
        lane,
        maxDate(
          developerCursor.get(lane) ?? project.project.startDate,
          shiftDate(end, 1)
        )
      );
    }
  }

  // Deteksi bentrok: developer sama + rentang tumpang tindih.
  const list = [...schedules.values()];
  for (const item of list) {
    if (!item.developer) {
      continue;
    }
    for (const other of list) {
      if (
        other.featureId !== item.featureId &&
        other.developer === item.developer &&
        rangesOverlap(
          item.startDate,
          item.endDate,
          other.startDate,
          other.endDate
        )
      ) {
        item.conflictsWith.push(other.featureId);
      }
    }
  }

  // Tulis ke fitur untuk dibaca Gantt (US-025).
  for (const item of list) {
    await writeFeatureSchedule(item.featureId, {
      startDate: item.startDate,
      endDate: item.endDate,
      overrideReason: item.overrideReason,
    });
  }

  return { data: list, error: null };
}

function maxDate(a: string, b: string): string {
  return a >= b ? a : b;
}

export interface ScheduleOverrideInput {
  startDate: string;
  endDate: string;
  reason: string;
}

/** Override manual dengan alasan wajib (US-024). */
export async function overrideFeatureSchedule(
  featureId: string,
  input: ScheduleOverrideInput
): Promise<ServiceResult<true>> {
  if (
    !input.startDate ||
    !input.endDate ||
    Number.isNaN(Date.parse(input.startDate)) ||
    Number.isNaN(Date.parse(input.endDate))
  ) {
    return { data: null, error: "Tanggal override tidak valid." };
  }
  if (input.startDate > input.endDate) {
    return { data: null, error: "Tanggal mulai override melewati tanggal selesai." };
  }
  if (!input.reason.trim()) {
    return { data: null, error: "Alasan override wajib diisi." };
  }
  const { error } = await writeFeatureSchedule(featureId, {
    startDate: input.startDate,
    endDate: input.endDate,
    overrideReason: input.reason.trim(),
    markOverridden: true,
  });
  if (error) {
    return { data: null, error };
  }
  return { data: true, error: null };
}
