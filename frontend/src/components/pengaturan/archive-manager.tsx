"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArchiveIcon,
  DownloadIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";
import {
  archiveRecord,
  exportModuleCsv,
  listArchiveItems,
  restoreRecord,
} from "@/services/archive";
import {
  ARCHIVE_ENTITY_TYPES,
  ARCHIVE_MODULES,
  emptyArchiveCounts,
  type ArchiveCounts,
  type ArchiveEntityType,
  type ArchiveItem,
} from "@/types/archive";

type ArchiveTab = "aktif" | "arsip";
type ModuleFilter = "all" | ArchiveEntityType;

interface ActionTarget {
  item: ArchiveItem;
  action: "archive" | "restore";
}

const MODULE_FILTER_OPTIONS: { value: ModuleFilter; label: string }[] = [
  { value: "all", label: "Semua modul" },
  ...ARCHIVE_ENTITY_TYPES.map((type) => ({
    value: type,
    label: ARCHIVE_MODULES[type].label,
  })),
];

function countItems(items: ArchiveItem[]): ArchiveCounts {
  const counts = emptyArchiveCounts();
  for (const item of items) {
    const bucket = item.archivedAt ? "archived" : "active";
    counts[item.type][bucket] += 1;
  }
  return counts;
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function itemMatchesSearch(item: ArchiveItem, search: string): boolean {
  if (!search) {
    return true;
  }
  const haystack =
    `${item.displayId} ${item.title} ${item.subtitle} ${item.status}`.toLowerCase();
  return haystack.includes(search);
}

/**
 * Halaman Arsip & Backup (US-043, FR-5) — Super Admin.
 *
 * Soft archive: data tidak dihapus, hanya `archived_at` diisi lewat RPC.
 * Tab Arsip menampilkan data yang bisa dipulihkan; ekspor CSV mengambil
 * seluruh baris modul (aktif + arsip) untuk cadangan logis.
 */
export function ArchiveManager() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [exporting, setExporting] = useState<ArchiveEntityType | null>(null);

  async function refresh() {
    setLoading(true);
    const { data, error } = await listArchiveItems();
    setLoading(false);
    if (error || !data) {
      setLoadError(error ?? "Gagal memuat daftar data arsip.");
      return;
    }
    setLoadError(null);
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    void listArchiveItems().then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (error || !data) {
        setLoadError(error ?? "Gagal memuat daftar data arsip.");
      } else {
        setItems(data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => countItems(items), [items]);
  const totalActive = useMemo(
    () =>
      ARCHIVE_ENTITY_TYPES.reduce(
        (total, type) => total + counts[type].active,
        0
      ),
    [counts]
  );
  const totalArchived = useMemo(
    () =>
      ARCHIVE_ENTITY_TYPES.reduce(
        (total, type) => total + counts[type].archived,
        0
      ),
    [counts]
  );

  function filteredItems(tab: ArchiveTab): ArchiveItem[] {
    const searchTerm = search.trim().toLowerCase();
    return items.filter((item) => {
      if (tab === "aktif" ? Boolean(item.archivedAt) : !item.archivedAt) {
        return false;
      }
      if (moduleFilter !== "all" && item.type !== moduleFilter) {
        return false;
      }
      return itemMatchesSearch(item, searchTerm);
    });
  }

  async function handleConfirm() {
    if (!target) {
      return;
    }
    setPending(true);
    setActionError(null);
    setNotice(null);
    const result =
      target.action === "archive"
        ? await archiveRecord(target.item.type, target.item.id)
        : await restoreRecord(target.item.type, target.item.id);
    setPending(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setTarget(null);
    setNotice(
      target.action === "archive"
        ? `${target.item.displayId} masuk arsip. Data tetap tersimpan dan dapat dipulihkan.`
        : `${target.item.displayId} dipulihkan dari arsip.`
    );
    await refresh();
  }

  async function handleExport(type: ArchiveEntityType) {
    setExporting(type);
    setActionError(null);
    setNotice(null);
    const result = await exportModuleCsv(type);
    setExporting(null);
    if (result.error || !result.data) {
      setActionError(result.error ?? "Gagal menyiapkan ekspor CSV.");
      return;
    }
    downloadCsv(result.data.filename, result.data.content);
    setNotice(
      `CSV ${ARCHIVE_MODULES[type].label} diunduh (${result.data.filename}).`
    );
  }

  function renderTable(visible: ArchiveItem[], tab: ArchiveTab) {
    if (loading) {
      return (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Memuat data arsip...
        </p>
      );
    }
    if (visible.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "Belum ada data yang bisa dikelola. Data akan tampil setelah modul terkait terisi."
            : tab === "aktif"
              ? "Tidak ada data aktif yang cocok dengan filter."
              : "Belum ada data di arsip yang cocok dengan filter."}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3">Modul</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{tab === "aktif" ? "Diperbarui" : "Diarsipkan"}</TableHead>
              <TableHead className="pr-3 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item) => (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell className="pl-3">
                  <Badge variant="secondary">
                    {ARCHIVE_MODULES[item.type].label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[30rem] whitespace-normal">
                  <p className="font-medium">
                    {item.title}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {item.displayId}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(
                    tab === "aktif" ? item.updatedAt : item.archivedAt ?? item.updatedAt
                  )}
                </TableCell>
                <TableCell className="pr-3 text-right">
                  {tab === "aktif" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setTarget({ item, action: "archive" });
                      }}
                    >
                      <ArchiveIcon aria-hidden="true" />
                      Arsipkan
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setTarget({ item, action: "restore" });
                      }}
                    >
                      <RotateCcwIcon aria-hidden="true" />
                      Pulihkan
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm font-medium text-primary">Pengaturan · Arsip</p>
        <h1 className="mt-1 text-2xl font-bold">Arsip &amp; Backup</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Arsipkan lead, proyek, atau materi konten yang sudah tidak aktif.
          Soft archive hanya mengisi <code>archived_at</code> di database;
          data, riwayat, task, dan relasi tetap utuh serta bisa dipulihkan
          kapan saja.
        </p>
      </div>

      {loadError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {ARCHIVE_ENTITY_TYPES.map((type) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{ARCHIVE_MODULES[type].label}</span>
                <ArchiveIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </CardTitle>
              <CardDescription>
                {ARCHIVE_MODULES[type].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-sm">
              <span>
                <strong className="text-lg">{counts[type].active}</strong>{" "}
                <span className="text-muted-foreground">aktif</span>
              </span>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <span>
                <strong className="text-lg">{counts[type].archived}</strong>{" "}
                <span className="text-muted-foreground">diarsipkan</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Ekspor data per modul (CSV)</CardTitle>
          <CardDescription>
            CSV memuat seluruh baris modul — termasuk data yang sudah
            diarsipkan — beserta kolom status arsip. Simpan berkas di tempat
            aman karena berisi data pelanggan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ARCHIVE_ENTITY_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              onClick={() => void handleExport(type)}
              disabled={exporting !== null}
            >
              <DownloadIcon aria-hidden="true" />
              {exporting === type
                ? "Menyiapkan..."
                : `Ekspor ${ARCHIVE_MODULES[type].label}`}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Kelola arsip</CardTitle>
          <CardDescription>
            Pilih data aktif untuk diarsipkan, atau buka tab Arsip untuk
            memulihkan data. Hanya Super Admin yang dapat melakukan aksi ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <div className="space-y-2">
              <label htmlFor="archive-search" className="text-sm font-medium">
                Cari data
              </label>
              <div className="relative">
                <SearchIcon
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="archive-search"
                  className="pl-8"
                  placeholder="ID, nama, status..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="archive-module" className="text-sm font-medium">
                Modul
              </label>
              <select
                id="archive-module"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                value={moduleFilter}
                onChange={(event) =>
                  setModuleFilter(event.target.value as ModuleFilter)
                }
              >
                {MODULE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan maksimal 500 data terbaru per modul. Ekspor CSV tetap
              memuat seluruh data.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCwIcon aria-hidden="true" />
              Muat ulang
            </Button>
          </div>

          <Tabs defaultValue="aktif" className="gap-4">
            <TabsList className="w-full max-w-sm">
              <TabsTrigger value="aktif">
                Aktif ({totalActive})
              </TabsTrigger>
              <TabsTrigger value="arsip">
                Arsip ({totalArchived})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="aktif">
              {renderTable(filteredItems("aktif"), "aktif")}
            </TabsContent>
            <TabsContent value="arsip">
              {renderTable(filteredItems("arsip"), "arsip")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Prosedur backup Supabase, retensi arsip, dan langkah pemulihan
        terdokumentasi di <code>docs/DEPLOYMENT.md</code>. Retensi akhir
        menunggu keputusan pemilik (Q-018); saat ini tidak ada penghapusan
        otomatis.
      </p>

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.action === "archive"
                ? "Arsipkan data ini?"
                : "Pulihkan data ini?"}
            </DialogTitle>
            <DialogDescription>
              {target?.action === "archive"
                ? "Data akan ditandai arsip di database, tetapi tidak dihapus. Kamu bisa memulihkannya dari tab Arsip."
                : "Data akan kembali aktif (archived_at dikosongkan)."}
            </DialogDescription>
          </DialogHeader>
          {target ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{target.item.title}</p>
              <p className="text-xs text-muted-foreground">
                {target.item.displayId} ·{" "}
                {ARCHIVE_MODULES[target.item.type].label}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={pending}
            >
              {pending
                ? "Memproses..."
                : target?.action === "archive"
                  ? "Ya, arsipkan"
                  : "Ya, pulihkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
