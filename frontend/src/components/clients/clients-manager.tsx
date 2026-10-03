"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientForm } from "@/components/clients/client-form";
import {
  listClients,
  listConvertibleLeads,
  type ClosingLeadOption,
} from "@/services/clients";
import type { Client } from "@/types/client";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; client: Client }
  | { mode: "from-lead"; lead: ClosingLeadOption };

/**
 * Halaman Master Klien (US-014): tabel klien + form + konversi
 * lead Closing menjadi klien tanpa input ulang (FR-9).
 */
export function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [convertible, setConvertible] = useState<ClosingLeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });

  async function refresh() {
    const [clientsResult, convertibleResult] = await Promise.all([
      listClients(),
      listConvertibleLeads(),
    ]);
    if (clientsResult.data) {
      setClients(clientsResult.data);
    }
    if (convertibleResult.data) {
      setConvertible(convertibleResult.data);
    }
    return clientsResult.error;
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listClients(), listConvertibleLeads()]).then(
      ([clientsResult, convertibleResult]) => {
        if (cancelled) {
          return;
        }
        if (clientsResult.data) {
          setClients(clientsResult.data);
        }
        if (convertibleResult.data) {
          setConvertible(convertibleResult.data);
        }
        setLoadError(clientsResult.error);
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
        <p className="text-sm text-muted-foreground">Memuat master klien...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Master klien belum tersedia</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Klien & Handover</p>
          <h1 className="mt-1 text-2xl font-bold">Master Klien</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length} klien terdaftar. Satu klien dapat memiliki banyak deal.
          </p>
        </div>
        <Button type="button" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon aria-hidden="true" /> Tambah klien
        </Button>
      </div>

      {warning ? (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {warning}
        </p>
      ) : null}

      {convertible.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Lead Closing belum menjadi klien</CardTitle>
            <CardDescription>
              Jadikan klien tanpa mengetik ulang — data terisi otomatis dari lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {convertible.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{lead.companyName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{lead.id}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWarning(null);
                          setDialog({ mode: "from-lead", lead });
                        }}
                      >
                        Jadikan klien <ArrowRightIcon aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">ID</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>PIC / Direktur</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {client.id}
                  </TableCell>
                  <TableCell className="font-medium">{client.companyName}</TableCell>
                  <TableCell>{client.picName}</TableCell>
                  <TableCell>
                    <p className="font-mono text-xs">{client.phone}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </TableCell>
                  <TableCell>{client.referrer}</TableCell>
                  <TableCell>
                    {client.sourceLeadId ? (
                      <Badge variant="secondary" className="font-mono">
                        {client.sourceLeadId}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWarning(null);
                        setDialog({ mode: "edit", client });
                      }}
                    >
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialog.mode !== "closed" ? (
        <ClientForm
          key={
            dialog.mode === "edit"
              ? `edit-${dialog.client.id}`
              : dialog.mode === "from-lead"
                ? `lead-${dialog.lead.id}`
                : "create"
          }
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialog({ mode: "closed" });
            }
          }}
          initial={dialog.mode === "edit" ? dialog.client : null}
          preset={
            dialog.mode === "from-lead"
              ? {
                  companyName: dialog.lead.companyName,
                  whatsapp: dialog.lead.whatsapp,
                  email: dialog.lead.email,
                  sourceLeadId: dialog.lead.id,
                }
              : undefined
          }
          onSaved={(saveWarning) => {
            setWarning(saveWarning);
            void refresh();
          }}
        />
      ) : null}
    </main>
  );
}
