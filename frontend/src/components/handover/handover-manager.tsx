"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HandoverForm } from "@/components/handover/handover-form";
import { listClients } from "@/services/clients";
import { listDeals, type DealWithClient } from "@/services/deals";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Draft:
    "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  "Menunggu Konfirmasi Produksi":
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Dikonfirmasi:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  "Perlu Revisi":
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

/**
 * Halaman Deal Handover (US-015): tabel + form dengan nama proyek
 * terformat otomatis `[Judul] - [Klien] ([Kode])`.
 */
export function HandoverManager() {
  const [deals, setDeals] = useState<DealWithClient[]>([]);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DealWithClient | null>(null);

  async function refresh() {
    const [dealsResult, clientsResult] = await Promise.all([listDeals(), listClients()]);
    if (dealsResult.data) {
      setDeals(dealsResult.data);
    }
    if (clientsResult.data) {
      setClients(
        clientsResult.data.map((client) => ({ id: client.id, companyName: client.companyName }))
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listDeals(), listClients()]).then(
      ([dealsResult, clientsResult]) => {
        if (cancelled) {
          return;
        }
        if (dealsResult.data) {
          setDeals(dealsResult.data);
        }
        if (clientsResult.data) {
          setClients(
            clientsResult.data.map((client) => ({
              id: client.id,
              companyName: client.companyName,
            }))
          );
        }
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat deal handover...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Klien & Handover</p>
          <h1 className="mt-1 text-2xl font-bold">Deal Handover</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kesepakatan Sales → Produksi. Handover Dikonfirmasi menjadi proyek (US-019).
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
        >
          <PlusIcon aria-hidden="true" /> Buat handover
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {deals.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Belum ada handover.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Nama Proyek</TableHead>
                  <TableHead>Nilai Deal</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map(({ deal, clientName, displayName }) => (
                  <TableRow key={deal.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.id} · {deal.features.length} fitur · {clientName}
                      </p>
                    </TableCell>
                    <TableCell>{formatCurrency(deal.value)}</TableCell>
                    <TableCell>{formatDate(deal.deadline)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[deal.status]}>
                        {deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deal.status === "Dikonfirmasi"}
                        title={
                          deal.status === "Dikonfirmasi"
                            ? "Hanya bisa diubah via change request"
                            : undefined
                        }
                        onClick={() => {
                          setEditTarget({ deal, clientName, displayName });
                          setDialogOpen(true);
                        }}
                      >
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dialogOpen ? (
        <HandoverForm
          key={editTarget ? `edit-${editTarget.deal.id}` : "create"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editTarget?.deal ?? null}
          clients={clients}
          onSaved={() => void refresh()}
        />
      ) : null}
    </main>
  );
}
