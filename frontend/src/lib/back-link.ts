/**
 * Menyelesaikan tautan kembali (?from=) ke halaman asal yang valid.
 * Hanya path internal yang diizinkan; selain itu pakai fallback.
 */
export function resolveBackLink(
  from: string | undefined,
  fallbackHref: string,
  fallbackLabel: string
): { href: string; label: string } {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return { href: from, label: "Kembali" };
  }
  return { href: fallbackHref, label: fallbackLabel };
}
