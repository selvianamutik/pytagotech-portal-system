"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ResetData() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/reset-data", { method: "POST" });
      const body = (await response.json()) as {
        data?: { message?: string };
        error?: string;
      };
      if (!response.ok || body.error) {
        setError(body.error ?? "Gagal mereset data demo.");
        return;
      }
      setMessage(body.data?.message ?? "Data demo berhasil dikembalikan.");
      setOpen(false);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
        <h1 className="mt-1 text-2xl font-bold">Reset Data Demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kembalikan data operasional portal ke snapshot UAT saat ini dalam satu
          klik. Berguna sebelum sesi pengujian berulang.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kembalikan data demo</CardTitle>
          <CardDescription>
            Menghapus semua lead, klien, handover, proyek, task, ide konten,
            materi, dan publikasi yang ada saat ini, lalu mengisi ulang data
            bawaan (2 lead, 1 klien, 1 handover + proyek, 3 task RAD/PUS/SAD,
            2 ide konten + 1 materi, 1 publikasi).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Akun login, role, tim, master data, libur, audit, dan notifikasi
            <strong> tidak</strong> ikut terhapus.
          </p>
          {message ? (
            <p role="status" className="text-sm text-emerald-600">
              {message}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button type="button" variant="destructive" />}
            >
              Reset data demo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yakin reset data demo?</DialogTitle>
                <DialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Semua data operasional
                  saat ini akan diganti dengan snapshot UAT.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleReset()}
                  disabled={pending}
                >
                  {pending ? "Mereset..." : "Ya, reset sekarang"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </main>
  );
}