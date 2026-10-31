import { beforeEach, describe, expect, it } from "vitest";

import { listAudit, resetMockAudit } from "@/services/audit";
import { resetMockClients } from "@/services/clients";
import { getUnreadNotificationCount } from "@/services/collaboration";
import { resetMockDeals } from "@/services/deals";
import { resetMockTerms } from "@/services/deal-terms";
import { transitionDealStatus } from "@/services/deal-workflow";
import type { StatusTransitionActor } from "@/services/deal-workflow";

const sales: StatusTransitionActor = { id: "USR-002", name: "Feby", roles: ["Sales / Marketing"] };
const pm: StatusTransitionActor = { id: "USR-003", name: "Raka", roles: ["Project Manager"] };

beforeEach(() => {
  resetMockClients();
  resetMockDeals();
  resetMockTerms();
  resetMockAudit();
});

describe("transitionDealStatus", () => {
  it("alur penuh Draft → Menunggu → Dikonfirmasi", async () => {
    // HDV-002 Draft dengan termin belum seimbang → pengajuan ditolak dulu.
    const blocked = await transitionDealStatus({
      dealId: "HDV-002",
      to: "Menunggu Konfirmasi Produksi",
      actor: sales,
    });
    expect(blocked.error).toMatch(/Termin belum seimbang/);

    // HDV-001 sudah Menunggu (seed) → PM konfirmasi.
    const confirmed = await transitionDealStatus({
      dealId: "HDV-001",
      to: "Dikonfirmasi",
      actor: pm,
    });
    expect(confirmed.error).toBeNull();
    expect(confirmed.data?.status).toBe("Dikonfirmasi");

    // Dikonfirmasi final → tidak bisa pindah lagi.
    expect(
      (
        await transitionDealStatus({ dealId: "HDV-001", to: "Perlu Revisi", actor: pm })
      ).error
    ).toMatch(/tidak dapat pindah/);
  });

  it("putusan hanya oleh PM; revisi wajib berkomentar", async () => {
    expect(
      (await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: sales })).error
    ).toMatch(/Hanya Project Manager/);

    expect(
      (await transitionDealStatus({ dealId: "HDV-001", to: "Perlu Revisi", actor: pm })).error
    ).toMatch(/wajib disertai komentar/);

    const revised = await transitionDealStatus({
      dealId: "HDV-001",
      to: "Perlu Revisi",
      actor: pm,
      comment: "Deadline terlalu mepet, minta mundur 2 minggu.",
    });
    expect(revised.error).toBeNull();

    // Revisi bisa diajukan ulang setelah dilengkapi.
    const resubmitted = await transitionDealStatus({
      dealId: "HDV-001",
      to: "Menunggu Konfirmasi Produksi",
      actor: sales,
    });
    expect(resubmitted.error).toBeNull();
  });

  it("setiap perubahan membuat notifikasi + audit", async () => {
    const unreadBefore = (await getUnreadNotificationCount()).data ?? 0;
    await transitionDealStatus({ dealId: "HDV-001", to: "Dikonfirmasi", actor: pm });

    expect(((await getUnreadNotificationCount()).data ?? 0) - unreadBefore).toBe(1);
    const audit = await listAudit("HDV-001");
    const entry = (audit.data ?? []).find((item) => item.action === "deal.status");
    expect(entry?.oldValue).toBe("Menunggu Konfirmasi Produksi");
    expect(entry?.newValue).toBe("Dikonfirmasi");
  });
});
