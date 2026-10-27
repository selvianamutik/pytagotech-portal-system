"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

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
import { usePortalSettings } from "@/hooks/use-portal-settings";
import {
  getSlaCompliance,
  isSlaMet,
  listInteractions,
  markInteractionReplied,
  recordInteraction,
  responseMinutes,
} from "@/services/community";
import { INTERACTION_CHANNELS, INTERACTION_TYPES } from "@/types/community";
import { formatDateTime } from "@/lib/utils";

/**
 * Community management (US-037, FR-26): interaksi + waktu tanggap
 * otomatis + SLA dari Pengaturan (US-041) + % tercapai.
 */
export function CommunityManager() {
  const { options } = useMasterOptions();
  const { settings } = usePortalSettings();
  const slaMinutes = settings.slaResponseMinutes;
  const [items, setItems] = useState<Awaited<ReturnType<typeof listInteractions>>["data"]>([]);
  const [compliance, setCompliance] = useState({ answered: 0, met: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channel, setChannel] = useState("");
  const [platform, setPlatform] = useState("");
  const [type, setType] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [handler, setHandler] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [repliedAt, setRepliedAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [{ data: list }, { data: sla }] = await Promise.all([
      listInteractions(),
      getSlaCompliance(slaMinutes),
    ]);
    if (list) {
      setItems(list);
    }
    if (sla) {
      setCompliance(sla);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listInteractions().then((list) => {
      if (!cancelled) {
        setItems(list.data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSlaCompliance(slaMinutes).then((sla) => {
      if (!cancelled && sla.data) {
        setCompliance(sla.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slaMinutes]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: recordError } = await recordInteraction({
      channel,
      platform,
      type,
      receivedAt,
      handler,
    });
    setPending(false);
    if (recordError) {
      setError(recordError);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyFor) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: replyError } = await markInteractionReplied(replyFor, repliedAt);
    setPending(false);
    if (replyError) {
      setError(replyError);
      return;
    }
    setReplyFor(null);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat interaksi...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Komunitas</p>
          <h1 className="mt-1 text-2xl font-bold">Community Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SLA {compliance.met}/{compliance.answered} tercapai ({compliance.percent.toFixed(0)}%)
            — ambang {slaMinutes} menit.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden="true" /> Catat interaksi
        </Button>
      </div>

      {error && !dialogOpen && !replyFor ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Interaksi</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Dibalas</TableHead>
                <TableHead>Tanggap</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => {
                const minutes = responseMinutes(item);
                const met = isSlaMet(item, slaMinutes);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">
                        {item.channel} · {item.platform} · {item.type}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.id} · {item.handler}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(item.receivedAt)}</TableCell>
                    <TableCell className="text-xs">
                      {item.repliedAt ? formatDateTime(item.repliedAt) : "—"}
                    </TableCell>
                    <TableCell>{minutes === null ? "—" : `${minutes} mnt`}</TableCell>
                    <TableCell>
                      {minutes === null ? (
                        <Badge variant="outline">Menunggu</Badge>
                      ) : met ? (
                        <Badge variant="default">Tercapai</Badge>
                      ) : (
                        <Badge variant="destructive">Terlewat</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!item.repliedAt ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyFor(item.id);
                            setRepliedAt("");
                            setError(null);
                          }}
                        >
                          Tandai dibalas
                        </Button>
                      ) : null}
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
            <DialogTitle>Interaksi baru</DialogTitle>
            <DialogDescription>Kanal, platform, tipe, waktu masuk.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect id="int-channel" label="Kanal" value={channel} onChange={setChannel} options={INTERACTION_CHANNELS} required />
            <FormSelect id="int-platform" label="Platform" value={platform} onChange={setPlatform} options={options.platform} required />
            <FormSelect id="int-type" label="Tipe" value={type} onChange={setType} options={INTERACTION_TYPES} required />
            <div className="space-y-2">
              <label htmlFor="int-received" className="text-sm font-medium">
                Waktu masuk
              </label>
              <Input
                id="int-received"
                type="datetime-local"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="int-handler" className="text-sm font-medium">
                Penangan
              </label>
              <Input id="int-handler" value={handler} onChange={(event) => setHandler(event.target.value)} />
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
        open={replyFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReplyFor(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandai dibalas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReply} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="int-replied" className="text-sm font-medium">
                Waktu dibalas
              </label>
              <Input
                id="int-replied"
                type="datetime-local"
                value={repliedAt}
                onChange={(event) => setRepliedAt(event.target.value)}
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
    </main>
  );
}
