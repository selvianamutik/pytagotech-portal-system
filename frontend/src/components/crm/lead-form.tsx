"use client";

import { useState } from "react";

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
import { useMasterOptions } from "@/hooks/use-master-options";
import { createLead, updateLead } from "@/services/leads";
import type { CreateLeadInput, Lead } from "@/types/lead";

/** Tanggal hari ini (WIB) dalam format input date. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null = mode tambah; Lead = mode ubah. */
  initial: Lead | null;
  picNames: string[];
  actor?: { id: string; name: string };
  onSaved: (warning: string | null) => void;
}

/**
 * Form tambah/ubah lead (US-007): validasi format + peringatan duplikat
 * ditampilkan dari hasil service (non-blokir).
 */
export function LeadForm({ open, onOpenChange, initial, picNames, actor, onSaved }: LeadFormProps) {
  const { options } = useMasterOptions();
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [picName, setPicName] = useState(initial?.picName ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "New");
  const [contactDate, setContactDate] = useState(initial?.contactDate ?? todayWib());
  const [nextFollowUp, setNextFollowUp] = useState(initial?.nextFollowUp ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catatan: parent me-mount ulang form via `key` setiap mode berubah,
  // sehingga state awal dari `initial` selalu segar.

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input: CreateLeadInput = {
      contactDate,
      companyName,
      industry,
      whatsapp,
      instagram,
      email,
      picName,
      status: status as Lead["status"],
      nextFollowUp: nextFollowUp || undefined,
    };
    const result = initial
      ? await updateLead(initial.id, input, actor)
      : await createLead(input);
    setPending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Gagal menyimpan lead.");
      return;
    }
    onOpenChange(false);
    onSaved(result.warning);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? `Ubah ${initial.id}` : "Tambah lead baru"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Perbarui data lead. Perubahan PIC/tahap tercatat untuk audit (US-004/009)."
              : "Lead berstatus Interest otomatis masuk pipeline (US-011). Closing menjadi klien tanpa input ulang (US-014)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="lead-company" className="text-sm font-medium">
              Perusahaan / Brand
            </label>
            <Input
              id="lead-company"
              placeholder="PT Contoh Abadi"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </div>
          <FormSelect
            id="lead-industry"
            label="Kategori industri"
            value={industry}
            onChange={setIndustry}
            options={options.industry}
            required
          />
          <div className="space-y-2">
            <label htmlFor="lead-date" className="text-sm font-medium">
              Tanggal hubungi
            </label>
            <Input
              id="lead-date"
              type="date"
              value={contactDate}
              onChange={(event) => setContactDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-wa" className="text-sm font-medium">
              WhatsApp
            </label>
            <Input
              id="lead-wa"
              inputMode="tel"
              placeholder="0812-3456-7890"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-ig" className="text-sm font-medium">
              Instagram
            </label>
            <Input
              id="lead-ig"
              placeholder="@brand (opsional)"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="lead-email"
              type="email"
              placeholder="halo@perusahaan.id"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-followup" className="text-sm font-medium">
              Follow-up berikutnya (opsional)
            </label>
            <Input
              id="lead-followup"
              type="date"
              value={nextFollowUp}
              onChange={(event) => setNextFollowUp(event.target.value)}
            />
          </div>
          <FormSelect
            id="lead-pic"
            label="PIC"
            value={picName}
            onChange={setPicName}
            options={picNames}
            required
          />
          <FormSelect
            id="lead-status"
            label="Status"
            value={status}
            onChange={setStatus}
            options={options.lead_status}
            required
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          ) : null}
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : initial ? "Simpan perubahan" : "Tambah lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
