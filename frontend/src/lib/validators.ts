/**
 * Validator format bersama (dipakai lintas service).
 * Aturan berasal dari PRD: US-007 (WhatsApp + email lead).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Normalisasi nomor WhatsApp Indonesia:
 * buang spasi/titik/strip, ubah awalan +62/62/0 menjadi 62.
 * @example normalizeWhatsapp("+62 812-3456-7890") → "6281234567890"
 */
export function normalizeWhatsapp(value: string): string {
  let digits = value.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+62")) {
    digits = "62" + digits.slice(3);
  } else if (digits.startsWith("62")) {
    digits = digits;
  } else if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  return digits;
}

/**
 * Nomor WhatsApp valid: awalan 62, operator seluler (8xx),
 * total 10–15 digit. Cek setelah normalisasi.
 */
export function isValidWhatsapp(value: string): boolean {
  return /^628\d{7,12}$/.test(normalizeWhatsapp(value));
}
