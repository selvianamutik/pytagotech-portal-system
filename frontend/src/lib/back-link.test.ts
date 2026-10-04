import { describe, expect, it } from "vitest";

import { resolveBackLink } from "@/lib/back-link";

describe("resolveBackLink", () => {
  it("memakai asal bila path internal valid", () => {
    expect(resolveBackLink("/kalender", "/proyek/x", "Detail")).toEqual({
      href: "/kalender",
      label: "Kembali",
    });
  });

  it("fallback bila kosong, eksternal, atau protocol-relative", () => {
    expect(resolveBackLink(undefined, "/proyek", "Daftar")).toEqual({
      href: "/proyek",
      label: "Daftar",
    });
    expect(resolveBackLink("https://evil.test", "/proyek", "Daftar").href).toBe("/proyek");
    expect(resolveBackLink("//evil.test", "/proyek", "Daftar").href).toBe("/proyek");
    expect(resolveBackLink("", "/proyek", "Daftar").href).toBe("/proyek");
  });
});
