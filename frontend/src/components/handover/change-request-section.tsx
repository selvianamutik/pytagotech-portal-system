"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import {
  createChangeRequest,
  decideChangeRequest,
  listChangeRequests,
} from "@/services/change-requests";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { ChangeRequest, DealVersion } from "@/types/deal";
import { CR_KINDS } from "@/types/deal";

const CR_STATUS_STYLES: Record<string, string> = {
  Diajukan:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Disetujui:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Ditolak:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

/**
 * Log change request + riwayat versi deal (US-018, FR-14).
 * CR yang disetujui memperbarui nilai/deadline dengan versi baru.
 */
export function ChangeRequestSection({
  dealId,
  versions,
  onChanged,
}: {
  dealId: string;
  versions: DealVersion[];
  onChanged: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ChangeRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<string>(CR_KINDS[0]);
  const [description, setDescription] = useState("");
  const [valueImpact, setValueImpact] = useState("");
  const [deadlineImpact, setDeadlineImpact] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actor() {
    return { id: user?.id ?? "USR-007", name: user?.name ?? "Figo" };
  }

  async function refresh() {
    const { data } = await listChangeRequests(dealId);
    if (data) {
      setItems(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listChangeRequests(dealId).then(({ data }) => {
      if (!cancelled && data) {
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: createError } = await createChangeRequest(
      dealId,
      {
        kind,
        description,
        valueImpact: valueImpact ? Number(valueImpact) : null,
        deadlineImpact: deadlineImpact || null,
      },
      actor()
    );
    setPending(false);
    if (createError) {
      setError(createError);
      return;
    }
    setDialogOpen(false);
    setDescription("");
    setValueImpact("");
    setDeadlineImpact("");
    await refresh();
  }

  async function handleDecide(crId: string, decision: "Disetujui" | "Ditolak") {
    setError(null);
    const { error: decideError } = await decideChangeRequest({
      crId,
      decision,
      actor: actor(),
    });
    if (decideError) {
      setError(decideError);
      return;
    }
    await refresh();
    onChanged();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-end justify-between border-b">
          <div>
            <CardTitle className="text-base">Change request</CardTitle>
            <CardDescription>Perubahan scope, harga, dan waktu terdokumentasi.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon aria-hidden="true" /> Ajukan CR
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada change request.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((cr) => (
                <li key={cr.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{cr.id}</span>
                    <Badge variant="secondary">{cr.kind}</Badge>
                    <Badge variant="outline" className={CR_STATUS_STYLES[cr.status]}>
                      {cr.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm">{cr.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cr.valueImpact ? `Nilai → ${formatCurrency(cr.valueImpact)} · ` : ""}
                    {cr.deadlineImpact ? `Deadline → ${formatDate(cr.deadlineImpact)} · ` : ""}
                    oleh {cr.createdByName} · {formatDateTime(cr.createdAt)}
                  </p>
                  {cr.status === "Diajukan" ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleDecide(cr.id, "Disetujui")}
                      >
                        Setujui
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDecide(cr.id, "Ditolak")}
                      >
                        Tolak
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Riwayat versi nilai & deadline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {versions.map((version) => (
              <li key={version.version} className="px-4 py-3">
                <p className="text-sm">
                  <span className="font-mono font-medium">v{version.version}</span> ·{" "}
                  {formatCurrency(version.value)} · {formatDate(version.deadline)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {version.note} · {formatDateTime(version.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan change request</DialogTitle>
            <DialogDescription>
              Isi minimal satu dampak. Bila disetujui, nilai/deadline deal
              diperbarui dengan versi baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormSelect id="cr-kind" label="Jenis" value={kind} onChange={setKind} options={CR_KINDS} />
            <div className="space-y-2">
              <label htmlFor="cr-desc" className="text-sm font-medium">Deskripsi</label>
              <textarea
                id="cr-desc"
                className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cr-value" className="text-sm font-medium">
                Dampak nilai (IDR, opsional)
              </label>
              <Input
                id="cr-value"
                type="number"
                min="1"
                value={valueImpact}
                onChange={(event) => setValueImpact(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cr-deadline" className="text-sm font-medium">
                Dampak deadline (opsional)
              </label>
              <Input
                id="cr-deadline"
                type="date"
                value={deadlineImpact}
                onChange={(event) => setDeadlineImpact(event.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Mengajukan..." : "Ajukan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
