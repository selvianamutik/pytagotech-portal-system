"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { createProjectFromHandover, listProjectManagers } from "@/services/projects";

/**
 * Dialog "Buat Proyek" pada handover Dikonfirmasi (US-019, FR-15):
 * salin seluruh data tanpa input ulang, dilengkapi PM + tanggal mulai.
 */
export function CreateProjectDialog({
  handoverId,
  open,
  onOpenChange,
}: {
  handoverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pmName, setPmName] = useState("");
  const [pmOptions, setPmOptions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listProjectManagers().then(({ data }) => {
      if (!cancelled) {
        setPmOptions(data ?? []);
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
    const { data, error: createError } = await createProjectFromHandover(handoverId, {
      pmName,
      startDate,
    });
    setPending(false);
    if (createError || !data) {
      setError(createError ?? "Gagal membuat proyek.");
      return;
    }
    onOpenChange(false);
    router.push(`/proyek/${data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat proyek dari handover</DialogTitle>
          <DialogDescription>
            Klien, nama, kode, nilai, deadline, dan daftar fitur disalin otomatis.
            Template task di-generate saat proyek dibuat (US-021).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            id="project-pm"
            label="Project Manager"
            value={pmName}
            onChange={setPmName}
            options={pmOptions}
            required
          />
          <div className="space-y-2">
            <label htmlFor="project-start" className="text-sm font-medium">
              Tanggal mulai
            </label>
            <Input
              id="project-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
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
              {pending ? "Membuat..." : "Buat proyek"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
