"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";

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
  getPipeline,
  moveInterestStage,
  updateInterestNeed,
} from "@/services/interest";
import type { InterestStage, PipelineCard } from "@/types/interest";

type ViewMode = "kanban" | "tabel";

/**
 * Pipeline Interested Leads (US-011): Kanban drag-and-drop + tabel,
 * editor tahap & kebutuhan klien. Anggota pipeline otomatis dari
 * lead berstatus Interest.
 */
export function InterestPipeline() {
  const { options } = useMasterOptions();
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("kanban");
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<PipelineCard | null>(null);
  const [editStage, setEditStage] = useState<InterestStage>("New Interest");
  const [editNeed, setEditNeed] = useState("");
  const [saving, setSaving] = useState(false);

  // Kolom kanban = opsi aktif + tahap lama yang masih tersimpan di kartu,
  // agar data lama tidak hilang saat opsi dinonaktifkan.
  const stages = Array.from(
    new Set([...options.interest_stage, ...cards.map((card) => card.stage)])
  );

  async function refresh() {
    const { data } = await getPipeline();
    if (data) {
      setCards(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void getPipeline().then(({ data }) => {
      if (cancelled) {
        return;
      }
      setCards(data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDrop(stage: InterestStage, leadId: string) {
    setError(null);
    const { error: moveError } = await moveInterestStage(leadId, stage);
    if (moveError) {
      setError(moveError);
      return;
    }
    await refresh();
  }

  function openEdit(card: PipelineCard) {
    setEditTarget(card);
    setEditStage(card.stage);
    setEditNeed(card.need);
    setError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editTarget) {
      return;
    }
    setSaving(true);
    setError(null);
    const needResult = await updateInterestNeed(editTarget.lead.id, editNeed);
    const stageResult = await moveInterestStage(editTarget.lead.id, editStage);
    setSaving(false);
    if (needResult.error || stageResult.error) {
      setError(needResult.error ?? stageResult.error);
      return;
    }
    setEditTarget(null);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat pipeline...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">CRM · Pipeline</p>
          <h1 className="mt-1 text-2xl font-bold">Interested Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} lead berminat. Seret kartu antar tahapan atau ubah
            lewat tombol sunting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button
            type="button"
            variant={view === "tabel" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("tabel")}
          >
            Tabel
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {cards.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Belum ada lead berminat. Lead berstatus Interest muncul otomatis di sini.
            </p>
          </CardContent>
        </Card>
      ) : view === "kanban" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => {
            const column = cards.filter((card) => card.stage === stage);
            return (
              <section
                key={stage}
                aria-label={`Tahap ${stage}`}
                className="rounded-xl border bg-muted/30 p-2"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const leadId = event.dataTransfer.getData("text/plain");
                  if (leadId) {
                    void handleDrop(stage as InterestStage, leadId);
                  }
                }}
              >
                <header className="flex items-center justify-between px-1 py-2">
                  <h2 className="text-sm font-semibold">{stage}</h2>
                  <Badge variant="secondary">{column.length}</Badge>
                </header>
                <div className="space-y-2">
                  {column.map((card) => (
                    <article
                      key={card.lead.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", card.lead.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
                    >
                      <p className="text-sm font-medium">{card.lead.companyName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {card.lead.id} · {card.lead.picName}
                      </p>
                      {card.need ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {card.need}
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1"
                        onClick={() => openEdit(card)}
                      >
                        <PencilIcon aria-hidden="true" /> Tahap & kebutuhan
                      </Button>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Lead</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead>Tahap</TableHead>
                  <TableHead>Kebutuhan / Solusi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.lead.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{card.lead.companyName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {card.lead.id}
                      </p>
                    </TableCell>
                    <TableCell>{card.lead.picName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{card.stage}</Badge>
                    </TableCell>
                    <TableCell className="max-w-72">
                      {card.need || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(card)}>
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.lead.companyName}</DialogTitle>
            <DialogDescription>
              Tahap {editTarget?.lead.id} · perubahan tahap tercatat di audit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <FormSelect
              id="interest-stage"
              label="Tahapan"
              value={editStage}
              onChange={(value) => setEditStage(value as InterestStage)}
              options={options.interest_stage}
            />
            <div className="space-y-2">
              <label htmlFor="interest-need" className="text-sm font-medium">
                Kebutuhan / solusi yang dicari klien
              </label>
              <textarea
                id="interest-need"
                className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
                value={editNeed}
                onChange={(event) => setEditNeed(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan alur</CardTitle>
          <CardDescription>
            Closing dari pipeline dilanjutkan ke klien + deal handover tanpa input
            ulang (US-014). Lead yang kalah (Lost) keluar dari pipeline.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
