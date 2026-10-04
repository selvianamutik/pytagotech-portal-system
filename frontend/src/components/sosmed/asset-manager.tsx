"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

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
  createAsset,
  listAssetsWithStatus,
  updateAsset,
  type AssetWithStatus,
} from "@/services/assets";
import { ASSET_OWNERS, type AssetInput } from "@/types/asset";
import { formatDate } from "@/lib/utils";

/**
 * Asset & Content Library (US-034, FR-27): metadata + lisensi +
 * peringatan kedaluwarsa 30 hari.
 */
export function AssetManager() {
  const [assets, setAssets] = useState<AssetWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetWithStatus | null>(null);
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState("");
  const [cloudLink, setCloudLink] = useState("");
  const [owner, setOwner] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listAssetsWithStatus();
    if (data) {
      setAssets(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listAssetsWithStatus().then(({ data }) => {
      if (!cancelled) {
        setAssets(data ?? []);
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
    setFileType("");
    setCloudLink("");
    setOwner("");
    setLicenseType("");
    setLicenseExpiry("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(asset: AssetWithStatus) {
    setEditTarget(asset);
    setName(asset.name);
    setFileType(asset.fileType);
    setCloudLink(asset.cloudLink);
    setOwner(asset.owner);
    setLicenseType(asset.licenseType);
    setLicenseExpiry(asset.licenseExpiry ?? "");
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input: AssetInput = {
      name,
      fileType,
      cloudLink,
      owner,
      licenseType,
      licenseExpiry: licenseExpiry || undefined,
    };
    const result = editTarget
      ? await updateAsset(editTarget.id, input)
      : await createAsset(input);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat aset...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Library</p>
          <h1 className="mt-1 text-2xl font-bold">Asset & Content Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {assets.length} aset. Kedaluwarsa ≤ 30 hari diperingatkan; yang lewat
            tidak bisa ditautkan.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah aset
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Aset</TableHead>
                <TableHead>Tipe / Pemilik</TableHead>
                <TableHead>Lisensi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="px-4">
                    <p className="font-medium">{asset.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {asset.id} · {asset.cloudLink || "tanpa link"}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.fileType} · {asset.owner}
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.licenseType}
                    {asset.licenseExpiry ? ` · s.d. ${formatDate(asset.licenseExpiry)}` : " · tanpa batas"}
                  </TableCell>
                  <TableCell>
                    {asset.expired ? (
                      <Badge variant="destructive">Kedaluwarsa</Badge>
                    ) : asset.expiringSoon ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {asset.daysLeft} hari lagi
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(asset)}>
                      <PencilIcon aria-hidden="true" /> Ubah
                    </Button>
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
            <DialogTitle>{editTarget ? `Ubah ${editTarget.id}` : "Aset baru"}</DialogTitle>
            <DialogDescription>Metadata + link cloud + info lisensi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="asset-name" className="text-sm font-medium">
                Nama aset
              </label>
              <Input id="asset-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="asset-type" className="text-sm font-medium">
                Tipe file
              </label>
              <Input id="asset-type" placeholder="Figma, PSD, MP4, ..." value={fileType} onChange={(event) => setFileType(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="asset-link" className="text-sm font-medium">
                Link cloud
              </label>
              <Input id="asset-link" placeholder="https://... (opsional)" value={cloudLink} onChange={(event) => setCloudLink(event.target.value)} />
            </div>
            <FormSelect id="asset-owner" label="Pemilik" value={owner} onChange={setOwner} options={ASSET_OWNERS} required />
            <div className="space-y-2">
              <label htmlFor="asset-license" className="text-sm font-medium">
                Jenis izin legal
              </label>
              <Input id="asset-license" value={licenseType} onChange={(event) => setLicenseType(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="asset-expiry" className="text-sm font-medium">
                Masa berlaku (kosongkan bila tanpa batas)
              </label>
              <Input
                id="asset-expiry"
                type="date"
                value={licenseExpiry}
                onChange={(event) => setLicenseExpiry(event.target.value)}
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
