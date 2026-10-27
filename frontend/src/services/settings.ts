import { createClient } from "@/lib/supabase/client";
import type { ServiceResult } from "@/services/result";
import type {
  Holiday,
  KpiTargetsByBrand,
  PortalSettings,
  ServiceHours,
} from "@/types/settings";
import {
  DEFAULT_PORTAL_SETTINGS,
  DEFAULT_SERVICE_HOURS,
  KPI_KEYS,
  isValidHolidayDate,
  isValidTime,
  isValidTimeRange,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/types/settings";

/**
 * Pengaturan operasional terpusat (US-041, FR-30).
 *
 * - `settings`: SLA respons/routing, jam layanan, nomor WhatsApp resmi,
 *   target KPI per lini bisnis, dan ambang kritis publikasi.
 * - `holidays`: kalender hari libur untuk penjadwalan fitur.
 *
 * Semua perubahan melewati tabel yang sudah terpasang trigger audit, sehingga
 * nilai lama/baru otomatis tercatat tanpa mengubah data historis (mis. snapshot
 * KPI Final tetap tersimpan apa adanya).
 */

type BrowserSupabase = ReturnType<typeof createClient>;

interface SettingRow {
  key: string;
  value: unknown;
}

interface HolidayRow {
  day: string;
  name: string | null;
}

interface DbError {
  message: string;
  code?: string;
}

export const SETTING_KEYS = {
  slaResponseMinutes: "sla.response_minutes",
  slaRoutingMinutes: "sla.routing_minutes",
  releaseCriticalHours: "release.critical_hours",
  serviceHours: "service_hours",
  waNumbers: "wa.numbers",
  kpiTargets: "kpi.targets",
} as const;

const MAX_SLA_MINUTES = 1440;
const MAX_CRITICAL_HOURS = 8760;
const MAX_TIMEZONE_LENGTH = 64;
const MAX_HOLIDAY_NAME_LENGTH = 120;

function errorMessage(error: DbError | null, fallback: string): string {
  if (!error) {
    return fallback;
  }
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "Akun ini tidak berwenang mengubah pengaturan portal.";
  }
  if (error.code === "23505") {
    return "Tanggal libur tersebut sudah ada.";
  }
  return error.message || fallback;
}

function readNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    return fallback;
  }
  return Math.round(numeric);
}

function readServiceHours(value: unknown): ServiceHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SERVICE_HOURS, days: [...DEFAULT_SERVICE_HOURS.days] };
  }
  const raw = value as Record<string, unknown>;
  const timezone =
    typeof raw.timezone === "string" && raw.timezone.trim().length > 0
      ? raw.timezone.trim()
      : DEFAULT_SERVICE_HOURS.timezone;
  const days = Array.isArray(raw.days)
    ? [
        ...new Set(
          raw.days.filter(
            (day): day is number =>
              typeof day === "number" &&
              Number.isInteger(day) &&
              day >= 0 &&
              day <= 6
          )
        ),
      ].sort((a, b) => a - b)
    : [...DEFAULT_SERVICE_HOURS.days];
  const start =
    typeof raw.start === "string" && isValidTime(raw.start)
      ? raw.start
      : DEFAULT_SERVICE_HOURS.start;
  const end =
    typeof raw.end === "string" && isValidTime(raw.end)
      ? raw.end
      : DEFAULT_SERVICE_HOURS.end;

  if (days.length === 0 || !isValidTimeRange(start, end)) {
    return { ...DEFAULT_SERVICE_HOURS, days: [...DEFAULT_SERVICE_HOURS.days] };
  }
  return { timezone, days, start, end };
}

function readWaNumbers(value: unknown): Record<string, string> {
  const result: Record<string, string> = { ...DEFAULT_PORTAL_SETTINGS.waNumbers };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }
  for (const [brand, raw] of Object.entries(value)) {
    if (
      brand.trim().length === 0 ||
      typeof raw !== "string" ||
      !isValidWhatsAppNumber(raw)
    ) {
      continue;
    }
    result[brand] = normalizeWhatsAppNumber(raw);
  }
  return result;
}

function readKpiTargets(value: unknown): KpiTargetsByBrand {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: KpiTargetsByBrand = {};
  for (const [brand, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const target: KpiTargetsByBrand[string] = {};
    for (const key of KPI_KEYS) {
      const numeric = (raw as Record<string, unknown>)[key];
      if (typeof numeric === "number" && Number.isFinite(numeric) && numeric >= 0) {
        target[key] = numeric;
      }
    }
    if (Object.keys(target).length > 0) {
      result[brand] = target;
    }
  }
  return result;
}

function settingMap(rows: SettingRow[]): Map<string, unknown> {
  return new Map(rows.map((row) => [row.key, row.value]));
}

function toHoliday(row: HolidayRow): Holiday | null {
  if (!isValidHolidayDate(row.day)) {
    return null;
  }
  return { day: row.day, name: row.name?.trim() || null };
}

/**
 * Baca seluruh pengaturan + hari libur. Bila database belum bisa diakses,
 * nilai default dikembalikan bersama pesan error agar UI tetap dapat tampil.
 */
export async function getPortalSettings(): Promise<ServiceResult<PortalSettings>> {
  const supabase = createClient();
  const [settingsResult, holidaysResult] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase.from("holidays").select("day, name").order("day", { ascending: true }),
  ]);

  const defaults: PortalSettings = {
    ...DEFAULT_PORTAL_SETTINGS,
    serviceHours: {
      ...DEFAULT_SERVICE_HOURS,
      days: [...DEFAULT_SERVICE_HOURS.days],
    },
    waNumbers: { ...DEFAULT_PORTAL_SETTINGS.waNumbers },
    kpiTargets: {},
    holidays: [],
  };

  if (settingsResult.error) {
    return {
      data: defaults,
      error: errorMessage(settingsResult.error, "Gagal memuat pengaturan portal."),
    };
  }

  const rows = (settingsResult.data ?? []) as SettingRow[];
  const map = settingMap(rows);
  const holidays = ((holidaysResult.data ?? []) as HolidayRow[])
    .map(toHoliday)
    .filter((holiday): holiday is Holiday => holiday !== null);

  return {
    data: {
      slaResponseMinutes: readNumber(
        map.get(SETTING_KEYS.slaResponseMinutes),
        DEFAULT_PORTAL_SETTINGS.slaResponseMinutes,
        1,
        MAX_SLA_MINUTES
      ),
      slaRoutingMinutes: readNumber(
        map.get(SETTING_KEYS.slaRoutingMinutes),
        DEFAULT_PORTAL_SETTINGS.slaRoutingMinutes,
        1,
        MAX_SLA_MINUTES
      ),
      releaseCriticalHours: readNumber(
        map.get(SETTING_KEYS.releaseCriticalHours),
        DEFAULT_PORTAL_SETTINGS.releaseCriticalHours,
        1,
        MAX_CRITICAL_HOURS
      ),
      serviceHours: readServiceHours(map.get(SETTING_KEYS.serviceHours)),
      waNumbers: readWaNumbers(map.get(SETTING_KEYS.waNumbers)),
      kpiTargets: readKpiTargets(map.get(SETTING_KEYS.kpiTargets)),
      holidays,
    },
    error: holidaysResult.error
      ? errorMessage(holidaysResult.error, "Gagal memuat kalender hari libur.")
      : null,
  };
}

/** Update baris `settings`; insert bila key belum ada. */
async function writeSetting(
  supabase: BrowserSupabase,
  key: string,
  value: unknown
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from("settings")
    .update({ value })
    .eq("key", key)
    .select("key");
  if (error) {
    return { error: errorMessage(error, "Gagal menyimpan pengaturan.") };
  }
  if (data && data.length > 0) {
    return { error: null };
  }

  const { error: insertError } = await supabase
    .from("settings")
    .insert({ key, value });
  if (insertError) {
    return { error: errorMessage(insertError, "Gagal menyimpan pengaturan.") };
  }
  return { error: null };
}

export interface OperationalSettingsInput {
  slaResponseMinutes: number;
  slaRoutingMinutes: number;
  releaseCriticalHours: number;
  serviceHours: ServiceHours;
  waNumbers: Record<string, string>;
}

function validateOperationalInput(
  input: OperationalSettingsInput
): { value: OperationalSettingsInput | null; error: string | null } {
  const response = Math.round(input.slaResponseMinutes);
  const routing = Math.round(input.slaRoutingMinutes);
  const critical = Math.round(input.releaseCriticalHours);

  if (!Number.isFinite(response) || response < 1 || response > MAX_SLA_MINUTES) {
    return { value: null, error: "SLA respons harus 1–1440 menit." };
  }
  if (!Number.isFinite(routing) || routing < 1 || routing > MAX_SLA_MINUTES) {
    return { value: null, error: "SLA routing harus 1–1440 menit." };
  }
  if (!Number.isFinite(critical) || critical < 1 || critical > MAX_CRITICAL_HOURS) {
    return {
      value: null,
      error: "Ambang kritis publikasi harus 1–8760 jam.",
    };
  }

  const timezone = input.serviceHours.timezone.trim();
  if (timezone.length === 0 || timezone.length > MAX_TIMEZONE_LENGTH) {
    return { value: null, error: "Zona waktu jam layanan wajib diisi (maks. 64 karakter)." };
  }
  const days = [...new Set(input.serviceHours.days)].sort((a, b) => a - b);
  if (days.length === 0 || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    return { value: null, error: "Pilih minimal satu hari layanan yang valid." };
  }
  if (!isValidTimeRange(input.serviceHours.start, input.serviceHours.end)) {
    return {
      value: null,
      error: "Jam layanan harus berformat HH:MM dan jam mulai lebih awal dari jam selesai.",
    };
  }

  const waNumbers: Record<string, string> = {};
  for (const [brand, raw] of Object.entries(input.waNumbers)) {
    const name = brand.trim();
    if (name.length === 0) {
      return { value: null, error: "Nama lini bisnis nomor WhatsApp tidak boleh kosong." };
    }
    if (!isValidWhatsAppNumber(raw)) {
      return {
        value: null,
        error: `Nomor WhatsApp ${name} tidak valid. Gunakan format +62… atau 08… (8–16 digit).`,
      };
    }
    waNumbers[name] = normalizeWhatsAppNumber(raw);
  }

  return {
    value: {
      slaResponseMinutes: response,
      slaRoutingMinutes: routing,
      releaseCriticalHours: critical,
      serviceHours: { timezone, days, start: input.serviceHours.start, end: input.serviceHours.end },
      waNumbers,
    },
    error: null,
  };
}

/** Simpan SLA, jam layanan, nomor WhatsApp, dan ambang kritis sekaligus. */
export async function saveOperationalSettings(
  input: OperationalSettingsInput
): Promise<ServiceResult<true>> {
  const validation = validateOperationalInput(input);
  if (!validation.value) {
    return { data: null, error: validation.error };
  }
  const value = validation.value;
  const supabase = createClient();
  const writes: { key: string; value: unknown; errorLabel: string }[] = [
    {
      key: SETTING_KEYS.slaResponseMinutes,
      value: value.slaResponseMinutes,
      errorLabel: "SLA respons",
    },
    {
      key: SETTING_KEYS.slaRoutingMinutes,
      value: value.slaRoutingMinutes,
      errorLabel: "SLA routing",
    },
    {
      key: SETTING_KEYS.releaseCriticalHours,
      value: value.releaseCriticalHours,
      errorLabel: "ambang kritis publikasi",
    },
    {
      key: SETTING_KEYS.serviceHours,
      value: value.serviceHours,
      errorLabel: "jam layanan",
    },
    {
      key: SETTING_KEYS.waNumbers,
      value: value.waNumbers,
      errorLabel: "nomor WhatsApp",
    },
  ];

  for (const write of writes) {
    const result = await writeSetting(supabase, write.key, write.value);
    if (result.error) {
      return {
        data: null,
        error: `${write.errorLabel} gagal disimpan: ${result.error}`,
      };
    }
  }
  return { data: true, error: null };
}

/** Validasi & simpan target KPI per lini bisnis (satu key `kpi.targets`). */
export async function saveKpiTargets(
  targets: KpiTargetsByBrand
): Promise<ServiceResult<true>> {
  if (!targets || typeof targets !== "object" || Array.isArray(targets)) {
    return { data: null, error: "Target KPI tidak valid." };
  }

  const normalized: KpiTargetsByBrand = {};
  for (const [brand, raw] of Object.entries(targets)) {
    const name = brand.trim();
    if (name.length === 0) {
      return { data: null, error: "Nama lini bisnis target KPI tidak boleh kosong." };
    }
    const target: KpiTargetsByBrand[string] = {};
    for (const key of KPI_KEYS) {
      const numeric = raw?.[key];
      if (numeric === undefined) {
        continue;
      }
      if (!Number.isFinite(numeric) || numeric < 0) {
        return {
          data: null,
          error: `Target ${key} untuk ${name} harus berupa angka ≥ 0.`,
        };
      }
      target[key] = Math.round(numeric * 100) / 100;
    }
    if (Object.keys(target).length > 0) {
      normalized[name] = target;
    }
  }

  const supabase = createClient();
  const result = await writeSetting(
    supabase,
    SETTING_KEYS.kpiTargets,
    normalized
  );
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: true, error: null };
}

export async function listHolidays(): Promise<ServiceResult<Holiday[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("holidays")
    .select("day, name")
    .order("day", { ascending: true });
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal memuat hari libur.") };
  }
  return {
    data: ((data ?? []) as HolidayRow[])
      .map(toHoliday)
      .filter((holiday): holiday is Holiday => holiday !== null),
    error: null,
  };
}

export async function createHoliday(
  day: string,
  name?: string
): Promise<ServiceResult<Holiday>> {
  if (!isValidHolidayDate(day)) {
    return { data: null, error: "Tanggal libur tidak valid." };
  }
  const trimmedName = (name ?? "").trim();
  if (trimmedName.length > MAX_HOLIDAY_NAME_LENGTH) {
    return {
      data: null,
      error: `Nama hari libur maksimal ${MAX_HOLIDAY_NAME_LENGTH} karakter.`,
    };
  }

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("holidays")
    .select("day")
    .eq("day", day)
    .limit(1);
  if (existing && existing.length > 0) {
    return { data: null, error: "Tanggal libur tersebut sudah ada." };
  }

  const { data, error } = await supabase
    .from("holidays")
    .insert({ day, name: trimmedName || null })
    .select("day, name");
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal menambah hari libur.") };
  }
  const row = ((data ?? []) as HolidayRow[])[0];
  return {
    data: row ? { day: row.day, name: row.name } : { day, name: trimmedName || null },
    error: null,
  };
}

export async function deleteHoliday(day: string): Promise<ServiceResult<null>> {
  if (!isValidHolidayDate(day)) {
    return { data: null, error: "Tanggal libur tidak valid." };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("holidays")
    .delete()
    .eq("day", day)
    .select("day");
  if (error) {
    return { data: null, error: errorMessage(error, "Gagal menghapus hari libur.") };
  }
  if (!data || data.length === 0) {
    return {
      data: null,
      error:
        "Hari libur tidak terhapus (0 baris). Muat ulang halaman; bila data masih ada, database menolak penghapusan.",
    };
  }
  return { data: null, error: null };
}
