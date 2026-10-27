/**
 * Kontrak pengaturan operasional portal (US-041, FR-30).
 *
 * Nilai disimpan di tabel `settings` (key/value jsonb) dan `holidays`.
 * Modul lain wajib membaca lewat `services/settings.ts` agar target KPI,
 * ambang SLA, jam layanan, nomor WhatsApp, dan hari libur tidak hardcode.
 */

import { SOSMED_BRANDS } from "@/types/sosmed";

export const KPI_KEYS = [
  "production",
  "reach",
  "engagement",
  "growth",
  "footprint",
  "handover",
] as const;

export type KpiKey = (typeof KPI_KEYS)[number];

export interface KpiDefinition {
  key: KpiKey;
  label: string;
  unit: string;
}

/** Definisi KPI yang sama dengan scorecard Sosmed (US-039). */
export const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: "production", label: "Content Production", unit: "konten" },
  { key: "reach", label: "Reach & Awareness", unit: "reach" },
  { key: "engagement", label: "Engagement Rate", unit: "%" },
  { key: "growth", label: "Audience Growth", unit: "followers" },
  { key: "footprint", label: "Social Footprint", unit: "followers" },
  { key: "handover", label: "WhatsApp Lead Handover", unit: "handover" },
];

export type KpiTargets = Record<KpiKey, number>;

/** Target dasar bila brand belum memiliki target khusus. */
export const DEFAULT_KPI_TARGETS: KpiTargets = {
  production: 12,
  reach: 500000,
  engagement: 3,
  growth: 500,
  footprint: 50000,
  handover: 20,
};

/** Target per lini bisnis; nilai boleh parsial dan di-merge dengan default. */
export type KpiTargetsByBrand = Record<string, Partial<KpiTargets>>;

export interface ServiceHours {
  timezone: string;
  /** Hari kerja memakai getDay(): 0 = Minggu ... 6 = Sabtu. */
  days: number[];
  /** HH:MM (24 jam). */
  start: string;
  end: string;
}

export interface Holiday {
  /** YYYY-MM-DD. */
  day: string;
  name: string | null;
}

export interface PortalSettings {
  /** SLA respons komunitas (default 30 menit). */
  slaResponseMinutes: number;
  /** SLA routing inquiry ke WhatsApp (default 15 menit). */
  slaRoutingMinutes: number;
  /** Jam keterlambatan publikasi sebelum status Kritis. */
  releaseCriticalHours: number;
  serviceHours: ServiceHours;
  /** Nomor WhatsApp resmi per lini bisnis. */
  waNumbers: Record<string, string>;
  kpiTargets: KpiTargetsByBrand;
  holidays: Holiday[];
}

export const DEFAULT_SERVICE_HOURS: ServiceHours = {
  timezone: "Asia/Jakarta",
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "18:00",
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  slaResponseMinutes: 30,
  slaRoutingMinutes: 15,
  releaseCriticalHours: 24,
  serviceHours: DEFAULT_SERVICE_HOURS,
  waNumbers: Object.fromEntries(SOSMED_BRANDS.map((brand) => [brand, ""])),
  kpiTargets: {},
  holidays: [],
};

export const DAY_LABELS: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

/** Urutan tampilan hari kerja: Senin–Minggu. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isKpiKey(value: string): value is KpiKey {
  return (KPI_KEYS as readonly string[]).includes(value);
}

export function isServiceDay(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** Validasi tanggal kalender YYYY-MM-DD (termasuk tanggal mustahil). */
export function isValidHolidayDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidTimeRange(start: string, end: string): boolean {
  return isValidTime(start) && isValidTime(end) && start < end;
}

/** Normalisasi nomor WhatsApp: buang spasi, tanda hubung, kurung, dan titik. */
export function normalizeWhatsAppNumber(value: string): string {
  return value.trim().replace(/[\s().-]/g, "");
}

/**
 * Nomor resmi boleh dikosongkan (belum diatur). Bila diisi, formatnya
 * +62… atau 08… dengan 8–16 digit.
 */
export function isValidWhatsAppNumber(value: string): boolean {
  const normalized = normalizeWhatsAppNumber(value);
  if (normalized === "") {
    return true;
  }
  return /^\+?\d{8,16}$/.test(normalized);
}

export function formatWhatsAppNumber(value: string): string {
  const normalized = normalizeWhatsAppNumber(value);
  return normalized === "" ? "Belum diatur" : normalized;
}

/** Target efektif satu brand: default ditimpa nilai yang tersimpan. */
export function resolveKpiTargets(
  targets: KpiTargetsByBrand,
  brand?: string
): KpiTargets {
  const stored = brand ? targets[brand] ?? {} : {};
  const resolved = { ...DEFAULT_KPI_TARGETS };
  for (const key of KPI_KEYS) {
    const value = stored[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      resolved[key] = value;
    }
  }
  return resolved;
}
