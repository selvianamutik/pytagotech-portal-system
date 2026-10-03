"use client";

import { useEffect, useState } from "react";
import { PlusIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadForm } from "@/components/crm/lead-form";
import { LeadTable } from "@/components/crm/lead-table";
import { listLeadPICs, listLeads } from "@/services/leads";
import type { Lead } from "@/types/lead";

/**
 * Halaman database lead (US-007): tabel + form tambah/ubah,
 * peringatan duplikat non-blokir, state loading/empty/error.
 */
export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [picNames, setPicNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listLeads(), listLeadPICs()]).then(([leadsResult, picsResult]) => {
      if (cancelled) {
        return;
      }
      if (leadsResult.error || !leadsResult.data) {
        setLoadError(leadsResult.error ?? "Gagal memuat lead.");
      } else {
        setLeads(leadsResult.data);
      }
      setPicNames((picsResult.data ?? []).map((pic) => pic.name));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    const { data } = await listLeads();
    if (data) {
      setLeads(data);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setWarning(null);
    setDialogOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setWarning(null);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat database lead...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Database lead belum tersedia</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => window.location.reload()}>
              Muat ulang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">CRM · Marketing</p>
          <h1 className="mt-1 text-2xl font-bold">Database Lead</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} prospek tersimpan terpusat. Nomor WhatsApp dan nama
            perusahaan diperiksa duplikat otomatis.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah lead
        </Button>
      </div>

      {warning ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      ) : null}

      {leads.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Belum ada lead. Tambahkan prospek pertama lewat tombol di atas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <LeadTable leads={leads} onEdit={openEdit} />
      )}

      {dialogOpen ? (
        <LeadForm
          key={editTarget ? `edit-${editTarget.id}` : "create"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editTarget}
          picNames={picNames}
          onSaved={(saveWarning) => {
            setWarning(saveWarning);
            void refresh();
          }}
        />
      ) : null}
    </main>
  );
}
