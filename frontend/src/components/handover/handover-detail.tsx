"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HandoverForm } from "@/components/handover/handover-form";
import { HandoverProjectSection } from "@/components/proyek/handover-project-section";
import { ChangeRequestSection } from "@/components/handover/change-request-section";
import { HandoverStatusActions } from "@/components/handover/handover-status";
import { TermsEditor } from "@/components/handover/terms-editor";
import { listClients } from "@/services/clients";
import { getDeal, type DealWithClient } from "@/services/deals";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Detail deal handover: info + fitur + termin (US-016).
 * Aksi status (US-017) dan change request (US-018) menyusul di halaman ini.
 */
export function HandoverDetail({
  dealId,
  backHref = "/handover",
  backLabel = "Semua handover",
}: {
  dealId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [item, setItem] = useState<DealWithClient | null>(null);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function refresh() {
    const [dealResult, clientsResult] = await Promise.all([getDeal(dealId), listClients()]);
    if (dealResult.data) {
      setItem(dealResult.data);
    } else {
      setNotFound(true);
    }
    if (clientsResult.data) {
      setClients(
        clientsResult.data.map((client) => ({ id: client.id, companyName: client.companyName }))
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getDeal(dealId), listClients()]).then(
      ([dealResult, clientsResult]) => {
        if (cancelled) {
          return;
        }
        if (dealResult.data) {
          setItem(dealResult.data);
        } else {
          setNotFound(true);
        }
        if (clientsResult.data) {
          setClients(
            clientsResult.data.map((client) => ({
              id: client.id,
              companyName: client.companyName,
            }))
          );
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Handover tidak ditemukan</CardTitle>
            <CardDescription>ID {dealId} tidak terdaftar.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat handover...</p>
      </main>
    );
  }

  const { deal, clientName, displayName } = item;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={backHref} />}>
        <ArrowLeftIcon aria-hidden="true" /> {backLabel}
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {deal.id} · {deal.code}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{displayName}</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline">{deal.status}</Badge>
            <Badge variant="secondary">{formatCurrency(deal.value)}</Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={deal.status === "Dikonfirmasi"}
          onClick={() => setEditOpen(true)}
        >
          <PencilIcon aria-hidden="true" /> Ubah handover
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Ringkasan kesepakatan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Klien</p>
            <p className="text-sm font-medium">{clientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target deadline</p>
            <p className="text-sm font-medium">{formatDate(deal.deadline)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Scope</p>
            <p className="text-sm">{deal.scope}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Daftar fitur</p>
            <ul className="mt-1 space-y-1">
              {deal.features.map((feature) => (
                <li key={feature.name} className="text-sm">
                  <span className="font-medium">{feature.name}</span>
                  <span className="text-muted-foreground"> — {feature.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Objektif akhir</p>
            <p className="text-sm">{deal.objective}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Skema termin</p>
            <p className="text-sm">{deal.termScheme}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Catatan</p>
            <p className="text-sm">{deal.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <TermsEditor dealId={deal.id} dealValue={deal.value} />

      <HandoverStatusActions
        dealId={deal.id}
        status={deal.status}
        onChanged={() => void refresh()}
      />

      <ChangeRequestSection
        dealId={deal.id}
        versions={deal.versions}
        onChanged={() => void refresh()}
      />

      <HandoverProjectSection handoverId={deal.id} handoverStatus={deal.status} />

      {editOpen ? (
        <HandoverForm
          key={`edit-${deal.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={deal}
          clients={clients}
          onSaved={() => void refresh()}
        />
      ) : null}
    </main>
  );
}
