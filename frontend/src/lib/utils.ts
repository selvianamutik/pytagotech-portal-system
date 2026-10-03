import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility untuk menggabungkan class Tailwind secara kondisional
 * Digunakan oleh shadcn/ui dan komponen kustom
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// Zona waktu & format tanggal
// ─────────────────────────────────────────────

/** Zona waktu standar seluruh aplikasi sesuai PRD Bagian 8 */
export const APP_TIMEZONE = "Asia/Jakarta";

/**
 * Format tanggal ke locale Indonesia (WIB)
 * @example formatDate("2026-01-15T07:00:00Z") → "15 Jan 2026"
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  };
  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(
    typeof date === "string" ? new Date(date) : date
  );
}

/**
 * Format datetime ke locale Indonesia (WIB)
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hitung selisih waktu dalam menit antara dua timestamp
 * Digunakan untuk kalkulasi SLA (US-037, US-038)
 */
export function diffInMinutes(
  start: string | Date,
  end: string | Date
): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
}

/**
 * Format persentase untuk ditampilkan di UI
 * @example formatPercent(0.756) → "75.6%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format nilai mata uang (IDR)
 * @example formatCurrency(5000000) → "Rp 5.000.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format ukuran file ke satuan terbaca (B, KB, MB)
 * @example formatFileSize(1536) → "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
