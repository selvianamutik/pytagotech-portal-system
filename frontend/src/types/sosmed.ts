/**
 * Konstanta bersama modul Sosmed (EPIC E–F).
 * Satu dataset untuk semua lini bisnis (jawaban Q-009);
 * kolom brand dipakai untuk filter.
 */

/** Tiga lini bisnis Pytagotech Group. */
export const SOSMED_BRANDS = ["Pytagotech", "Pytabelajar", "Pytafix"] as const;

export type SosmedBrand = (typeof SOSMED_BRANDS)[number];

/** Platform distribusi (US-031). */
export const SOSMED_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Threads",
  "Facebook",
  "YouTube Shorts",
] as const;

export type SosmedPlatform = (typeof SOSMED_PLATFORMS)[number];

export function isSosmedBrand(value: string): value is SosmedBrand {
  return (SOSMED_BRANDS as readonly string[]).includes(value);
}

export function isSosmedPlatform(value: string): value is SosmedPlatform {
  return (SOSMED_PLATFORMS as readonly string[]).includes(value);
}
