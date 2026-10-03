"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { createDeal, updateDeal } from "@/services/deals";
import type { CreateDealInput, DealFeature, DealHandover } from "@/types/deal";

/**
 * Panduan pengisian interim (US-015) — diturunkan dari field PRD.
 * Akan diganti SOP resmi dari sheet "Read me" setelah Q-012 dijawab.
 */
const SOP_GUIDE: { field: string; hint: string }[] = [
  { field: "Judul proyek", hint: "Nama singkat hasil akhir, tanpa nama klien (otomatis digabung)." },
  { field: "Kode proyek", hint: "Unik, format PYT-TAHUN-NOMOR. Tidak bisa diubah setelah dipakai." },
  { field: "Scope & fitur", hint: "Tulis batas pekerjaan + tiap fitur dengan penjelasan outputnya." },
  { field: "Objektif akhir", hint: "Hasil terukur yang dijanjikan ke klien." },
  { field: "Nilai deal", hint: "Nominal kontrak (IDR). Total termin harus sama (US-016)." },
  { field: "Skema termin", hint: "Ringkasan pembagian, mis. 50-30-20. Detail di termin." },
  { field: "Target deadline", hint: "Tanggal serah terima. PM meninjau kewajarannya (US-017)." },
];

interface HandoverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: DealHandover | null;
  clients: { id: string; companyName: string }[];
  onSaved: () => void;
}

/** Form tambah/ubah deal handover + panel panduan (US-015). */
export function HandoverForm({ open, onOpenChange, initial, clients, onSaved }: HandoverFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "");
  const [features, setFeatures] = useState<DealFeature[]>(
    initial?.features ?? [{ name: "", description: "" }]
  );
  const [objective, setObjective] = useState(initial?.objective ?? "");
  const [value, setValue] = useState(initial ? String(initial.value) : "");
  const [termScheme, setTermScheme] = useState(initial?.termScheme ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setFeature(index: number, patch: Partial<DealFeature>) {
    setFeatures((previous) =>
      previous.map((feature, position) =>
        position === index ? { ...feature, ...patch } : feature
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input: CreateDealInput = {
      title,
      code,
      clientId,
      scope,
      features,
      objective,
      value: Number(value),
      termScheme,
      deadline,
      notes,
    };
    const result = initial
      ? await updateDeal(initial.id, input)
      : await createDeal(input);
    setPending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Gagal menyimpan handover.");
      return;
    }
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initial ? `Ubah ${initial.id}` : "Handover deal baru"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Handover Draft/Perlu Revisi masih bisa diubah."
              : "Handover baru berstatus Draft. Ajukan ke Produksi setelah termin diisi (US-017)."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="deal-title" className="text-sm font-medium">Judul proyek</label>
              <Input id="deal-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="deal-code" className="text-sm font-medium">Kode proyek</label>
              <Input id="deal-code" placeholder="PYT-2026-003" value={code} onChange={(event) => setCode(event.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <FormSelect
                id="deal-client"
                label="Klien"
                value={clientId}
                onChange={setClientId}
                options={clients.map((client) => ({
                  value: client.id,
                  label: `${client.companyName} (${client.id})`,
                }))}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="deal-scope" className="text-sm font-medium">Scope</label>
              <textarea id="deal-scope" className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring" value={scope} onChange={(event) => setScope(event.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Daftar fitur (dengan penjelasan)</span>
              {features.map((feature, index) => (
                <div key={index} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_2fr_auto]">
                  <Input
                    aria-label={`Nama fitur ${index + 1}`}
                    placeholder="Nama fitur"
                    value={feature.name}
                    onChange={(event) => setFeature(index, { name: event.target.value })}
                  />
                  <Input
                    aria-label={`Penjelasan fitur ${index + 1}`}
                    placeholder="Penjelasan output"
                    value={feature.description}
                    onChange={(event) => setFeature(index, { description: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus fitur ${index + 1}`}
                    disabled={features.length <= 1}
                    onClick={() => setFeatures((previous) => previous.filter((_, position) => position !== index))}
                  >
                    <MinusIcon aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFeatures((previous) => [...previous, { name: "", description: "" }])}
              >
                <PlusIcon aria-hidden="true" /> Tambah fitur
              </Button>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="deal-objective" className="text-sm font-medium">Objektif akhir</label>
              <Input id="deal-objective" value={objective} onChange={(event) => setObjective(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="deal-value" className="text-sm font-medium">Nilai deal (IDR)</label>
              <Input id="deal-value" type="number" min="1" step="1000" placeholder="45000000" value={value} onChange={(event) => setValue(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="deal-scheme" className="text-sm font-medium">Skema termin</label>
              <Input id="deal-scheme" placeholder="50-30-20" value={termScheme} onChange={(event) => setTermScheme(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="deal-deadline" className="text-sm font-medium">Target deadline</label>
              <Input id="deal-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="deal-notes" className="text-sm font-medium">Catatan</label>
              <Input id="deal-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>
            ) : null}
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : initial ? "Simpan perubahan" : "Buat handover"}
              </Button>
            </DialogFooter>
          </form>
          <aside aria-label="Panduan pengisian" className="h-fit rounded-xl border bg-muted/40 p-3 md:sticky md:top-4">
            <p className="text-sm font-semibold">Panduan pengisian</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Interim dari PRD — SOP resmi menyusul (Q-012).
            </p>
            <ul className="mt-2 space-y-2">
              {SOP_GUIDE.map((guide) => (
                <li key={guide.field} className="text-xs leading-5">
                  <span className="font-medium">{guide.field}:</span>{" "}
                  <span className="text-muted-foreground">{guide.hint}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
