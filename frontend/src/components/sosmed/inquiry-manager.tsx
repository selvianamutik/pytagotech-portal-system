"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import {
  convertInquiryToLead,
  isRoutingSlaMet,
  listInquiries,
  markInquiryRouted,
  recordInquiry,
  routingMinutes,
  ROUTING_SLA_MINUTES,
  setInquiryStatus,
} from "@/services/inquiries";
import { listLeadPICs } from "@/services/leads";
import { INQUIRY_STATUSES, type Inquiry } from "@/types/inquiry";
import { formatDateTime } from "@/lib/utils";

/**
 * Inquiry tracking & handover WhatsApp (US-038, FR-28): catat inquiry,
 * SLA routing 15 menit, status, dan tombol Jadikan Lead CRM.
 */
export function InquiryManager() {
  const { options } = useMasterOptions();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [picNames, setPicNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [brand, setBrand] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [handler, setHandler] = useState("");
  const [routeFor, setRouteFor] = useState<string | null>(null);
  const [routedAt, setRoutedAt] = useState("");
  const [convertTarget, setConvertTarget] = useState<Inquiry | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [picName, setPicName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const [{ data: list }, { data: pics }] = await Promise.all([
      listInquiries(),
      listLeadPICs(),
    ]);
    if (list) {
      setItems(list);
    }
    if (pics) {
      setPicNames(pics.map((pic) => pic.name));
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listInquiries(), listLeadPICs()]).then(([list, pics]) => {
      if (!cancelled) {
        setItems(list.data ?? []);
        setPicNames((pics.data ?? []).map((pic) => pic.name));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: recordError } = await recordInquiry({ platform, brand, receivedAt, handler });
    setPending(false);
    if (recordError) {
      setError(recordError);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleRoute(event: React.FormEvent) {
    event.preventDefault();
    if (!routeFor) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: routeError } = await markInquiryRouted(routeFor, routedAt);
    setPending(false);
    if (routeError) {
      setError(routeError);
      return;
    }
    setRouteFor(null);
    await refresh();
  }

  async function handleConvert(event: React.FormEvent) {
    event.preventDefault();
    if (!convertTarget) {
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    const { data, error: convertError } = await convertInquiryToLead(convertTarget.id, {
      companyName,
      whatsapp,
      email,
      picName,
    });
    setPending(false);
    if (convertError || !data) {
      setError(convertError ?? "Gagal membuat lead.");
      return;
    }
    setConvertTarget(null);
    setNotice(`Lead ${data.leadId} dibuat dengan sumber tercatat.`);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat inquiry...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Komunitas</p>
          <h1 className="mt-1 text-2xl font-bold">Inquiry Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SLA routing WhatsApp ≤ {ROUTING_SLA_MINUTES} menit.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden="true" /> Catat inquiry
        </Button>
      </div>

      {notice ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}
      {error && !dialogOpen && !routeFor && !convertTarget ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Inquiry</TableHead>
                <TableHead>Masuk → WA</TableHead>
                <TableHead>Routing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const minutes = routingMinutes(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">
                        {item.platform} · {item.brand}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.id} · {item.handler}
                        {item.leadId ? ` → ${item.leadId}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(item.receivedAt)}
                      {item.routedAt ? (
                        <>
                          <br />→ {formatDateTime(item.routedAt)}
                        </>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {minutes === null ? (
                        <Badge variant="outline">Belum</Badge>
                      ) : isRoutingSlaMet(item) ? (
                        <Badge variant="default">{minutes} mnt</Badge>
                      ) : (
                        <Badge variant="destructive">{minutes} mnt</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <select
                        aria-label={`Status ${item.id}`}
                        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                        value={item.status}
                        onChange={(event) =>
                          void setInquiryStatus(item.id, event.target.value).then(() => void refresh())
                        }
                      >
                        {INQUIRY_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {!item.routedAt ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRouteFor(item.id);
                              setRoutedAt("");
                              setError(null);
                            }}
                          >
                            Dialihkan WA
                          </Button>
                        ) : null}
                        {!item.leadId ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setConvertTarget(item);
                              setCompanyName("");
                              setWhatsapp("");
                              setEmail("");
                              setPicName("");
                              setError(null);
                            }}
                          >
                            <ArrowRightIcon aria-hidden="true" /> Jadikan Lead
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inquiry baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect id="inq-platform" label="Platform sumber" value={platform} onChange={setPlatform} options={options.platform} required />
            <FormSelect id="inq-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={options.brand} required />
            <div className="space-y-2">
              <label htmlFor="inq-received" className="text-sm font-medium">
                Waktu masuk
              </label>
              <Input
                id="inq-received"
                type="datetime-local"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="inq-handler" className="text-sm font-medium">
                Penangan
              </label>
              <Input id="inq-handler" value={handler} onChange={(event) => setHandler(event.target.value)} />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={routeFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRouteFor(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialihkan ke WhatsApp resmi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoute} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="inq-routed" className="text-sm font-medium">
                Waktu dialihkan
              </label>
              <Input
                id="inq-routed"
                type="datetime-local"
                value={routedAt}
                onChange={(event) => setRoutedAt(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={convertTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConvertTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadikan lead CRM</DialogTitle>
            <DialogDescription>
              Sumber Sosmed/{convertTarget?.platform} tercatat otomatis di lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="conv-company" className="text-sm font-medium">
                Perusahaan / Brand
              </label>
              <Input id="conv-company" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="conv-wa" className="text-sm font-medium">
                WhatsApp
              </label>
              <Input id="conv-wa" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="conv-email" className="text-sm font-medium">
                Email
              </label>
              <Input id="conv-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <FormSelect id="conv-pic" label="PIC" value={picName} onChange={setPicName} options={picNames} required />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Membuat..." : "Buat lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
