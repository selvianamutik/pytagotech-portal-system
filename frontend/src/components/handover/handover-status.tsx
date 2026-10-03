"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transitionDealStatus } from "@/services/deal-workflow";
import { useAuthStore } from "@/store/auth";
import type { HandoverStatus } from "@/types/deal";

/**
 * Aksi alur status handover (US-017, FR-13).
 * Putusan (konfirmasi/revisi) hanya untuk Project Manager / Super Admin;
 * pengajuan bisa oleh Sales. Komentar wajib saat meminta revisi.
 */
export function HandoverStatusActions({
  dealId,
  status,
  onChanged,
}: {
  dealId: string;
  status: HandoverStatus;
  onChanged: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? ["Sales / Marketing"];
  const actor = {
    id: user?.id ?? "USR-002",
    name: user?.name ?? "Feby",
    roles: [...roles],
  };
  const canDecide =
    roles.includes("Project Manager") || roles.includes("Super Admin");

  async function act(to: HandoverStatus) {
    setPending(true);
    setError(null);
    const { error: transitionError } = await transitionDealStatus({
      dealId,
      to,
      actor,
      comment: comment || undefined,
    });
    setPending(false);
    if (transitionError) {
      setError(transitionError);
      return;
    }
    setComment("");
    onChanged();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Konfirmasi Produksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Status saat ini: <span className="font-medium text-foreground">{status}</span>
        </p>

        {status === "Draft" || status === "Perlu Revisi" ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => void act("Menunggu Konfirmasi Produksi")}
          >
            {pending
              ? "Mengajukan..."
              : status === "Draft"
                ? "Ajukan ke Produksi"
                : "Ajukan ulang ke Produksi"}
          </Button>
        ) : null}

        {status === "Menunggu Konfirmasi Produksi" ? (
          canDecide ? (
            <>
              <div className="space-y-2">
                <label htmlFor={`pm-comment-${dealId}`} className="text-sm font-medium">
                  Komentar PM (wajib bila meminta revisi)
                </label>
                <textarea
                  id={`pm-comment-${dealId}`}
                  className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
                  placeholder="Contoh: deadline terlalu mepet, minta mundur 2 minggu dan termin 40-30-30."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={pending} onClick={() => void act("Dikonfirmasi")}>
                  {pending ? "Memproses..." : "Konfirmasi"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => void act("Perlu Revisi")}
                >
                  {pending ? "Memproses..." : "Minta revisi"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Menunggu keputusan Project Manager. Sales mendapat notifikasi setiap
              perubahan status.
            </p>
          )
        ) : null}

        {status === "Dikonfirmasi" ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Handover dikonfirmasi — siap dijadikan proyek (US-019).
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
