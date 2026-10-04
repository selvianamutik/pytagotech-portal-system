"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

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
import {
  createDeveloper,
  deleteDeveloper,
  listDevelopers,
  updateDeveloper,
} from "@/services/developers";
import type { Developer } from "@/types/developer";
import { EMPLOYMENT_STATUSES } from "@/types/developer";

/**
 * Master data developer (permintaan pemilik): daftar nama + status
 * internal/external untuk dropdown penugasan task/fitur.
 */
export function DeveloperManager() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Developer | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listDevelopers();
    if (data) {
      setDevelopers(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listDevelopers().then(({ data }) => {
      if (!cancelled) {
        setDevelopers(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditTarget(null);
    setName("");
    setStatus("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(developer: Developer) {
    setEditTarget(developer);
    setName(developer.name);
    setStatus(developer.status);
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = editTarget
      ? await updateDeveloper(editTarget.id, { name, status })
      : await createDeveloper({ name, status });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  async function handleDelete(developerId: string) {
    const { error: deleteError } = await deleteDeveloper(developerId);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat developer...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold">Master Data Developer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar penanggung jawab task/fitur + status internal/external
            (karyawan, magang, freelance).
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah developer
        </Button>
      </div>

      {error && !dialogOpen ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {developers.map((developer) => (
                <TableRow key={developer.id}>
                  <TableCell className="px-4">
                    <p className="font-medium">{developer.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{developer.id}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={developer.status === "internal" ? "default" : "secondary"}>
                      {developer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(developer)}>
                        <PencilIcon aria-hidden="true" /> Ubah
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${developer.name}`}
                        onClick={() => void handleDelete(developer.id)}
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Developer baru"}</DialogTitle>
            <DialogDescription>Nama + status kepegawaian.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dev-name" className="text-sm font-medium">
                Nama
              </label>
              <Input
                id="dev-name"
                placeholder="Nama + keterangan, mis. Dimas (Freelance)"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <FormSelect
              id="dev-status"
              label="Status"
              value={status}
              onChange={setStatus}
              options={EMPLOYMENT_STATUSES}
              required
            />
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
