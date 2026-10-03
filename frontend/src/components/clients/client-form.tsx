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
import { createClient, createClientFromLead, updateClient } from "@/services/clients";
import type { Client } from "@/types/client";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Client | null;
  /** Prefill dari lead Closing (nama/WA/email sudah terisi). */
  preset?: { companyName: string; whatsapp: string; email: string; sourceLeadId: string };
  onSaved: (warning: string | null) => void;
}

/** Form tambah/ubah klien (US-014). */
export function ClientForm({ open, onOpenChange, initial, preset, onSaved }: ClientFormProps) {
  const [companyName, setCompanyName] = useState(
    initial?.companyName ?? preset?.companyName ?? ""
  );
  const [picName, setPicName] = useState(initial?.picName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? preset?.whatsapp ?? "");
  const [email, setEmail] = useState(initial?.email ?? preset?.email ?? "");
  const [referrer, setReferrer] = useState(initial?.referrer ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedFromLead = !initial && Boolean(preset);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    let result;
    if (initial) {
      result = await updateClient(initial.id, { companyName, picName, phone, email, referrer });
    } else if (preset) {
      // Data perusahaan/WA/email dikunci dari lead (FR-9: tanpa input ulang).
      result = await createClientFromLead(preset.sourceLeadId, { picName, referrer });
    } else {
      result = await createClient({ companyName, picName, phone, email, referrer });
    }
    setPending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Gagal menyimpan klien.");
      return;
    }
    onOpenChange(false);
    onSaved(result.warning);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? `Ubah ${initial.id}` : preset ? `Klien baru dari ${preset.sourceLeadId}` : "Tambah klien"}
          </DialogTitle>
          <DialogDescription>
            {preset
              ? "Data terisi otomatis dari lead Closing — lengkapi PIC/Direktur dan referrer."
              : "Satu klien dapat memiliki banyak proyek/deal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="client-company" className="text-sm font-medium">
              Perusahaan / Entitas
            </label>
            <Input
              id="client-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
              disabled={lockedFromLead}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="client-pic" className="text-sm font-medium">
              PIC / Direktur
            </label>
            <Input
              id="client-pic"
              placeholder="Bpk./Ibu ..."
              value={picName}
              onChange={(event) => setPicName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="client-phone" className="text-sm font-medium">
              Telepon / WhatsApp
            </label>
            <Input
              id="client-phone"
              inputMode="tel"
              placeholder="0812-3456-7890"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              disabled={lockedFromLead}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="client-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="client-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={lockedFromLead}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="client-referrer" className="text-sm font-medium">
              Referrer (sumber lead)
            </label>
            <Input
              id="client-referrer"
              placeholder="Referral, Instagram, ..."
              value={referrer}
              onChange={(event) => setReferrer(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          ) : null}
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : initial ? "Simpan perubahan" : "Simpan klien"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
