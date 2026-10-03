"use client";

import { useState } from "react";
import { CircleAlertIcon, CircleCheckIcon, DownloadIcon, UploadIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importLeads,
  LEAD_CSV_TEMPLATE,
  previewLeadImport,
  type ImportPreview,
  type ImportResult,
} from "@/services/lead-import";

/**
 * Dialog impor lead dari CSV (US-010): unduh template → unggah →
 * preview valid/tidak-valid/duplikat → konfirmasi dengan opsi lewati duplikat.
 */
export function ImportLeadsDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  function downloadTemplate() {
    const blob = new Blob([LEAD_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-lead.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    const { data, error } = await previewLeadImport(text);
    if (error || !data) {
      setPreview(null);
      setPreviewError(error ?? "Gagal membaca file.");
      return;
    }
    setPreview(data);
    setPreviewError(null);
  }

  async function handleConfirm() {
    if (!preview) {
      return;
    }
    setPending(true);
    const { data } = await importLeads(preview, { skipDuplicates });
    setPending(false);
    if (data) {
      setResult(data);
      onImported();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Impor lead dari CSV</DialogTitle>
          <DialogDescription>
            Untuk lead baru ke depan (bukan migrasi data lama). Unduh template,
            isi, unggah, periksa preview, lalu konfirmasi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <DownloadIcon aria-hidden="true" /> Unduh template
            </Button>
            <div>
              <input
                id="lead-csv-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                render={<label htmlFor="lead-csv-file" className="cursor-pointer" />}
              >
                <UploadIcon aria-hidden="true" /> Pilih file CSV
              </Button>
            </div>
            {fileName ? (
              <span className="self-center font-mono text-xs text-muted-foreground">
                {fileName}
              </span>
            ) : null}
          </div>

          {previewError ? (
            <p role="alert" className="text-sm text-destructive">
              {previewError}
            </p>
          ) : null}

          {preview ? (
            <>
              <p className="flex flex-wrap gap-2 text-sm" role="status">
                <Badge variant="secondary">{preview.validCount} valid</Badge>
                <Badge variant="outline">{preview.invalidCount} tidak valid</Badge>
                <Badge variant="outline">{preview.duplicateCount} duplikat</Badge>
              </p>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {preview.rows.map((row) => {
                  const tone = row.errors.length > 0 ? "destructive" : row.duplicateWith.length > 0 ? "warning" : "ok";
                  return (
                    <li
                      key={row.lineNumber}
                      className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      {tone === "ok" ? (
                        <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <CircleAlertIcon
                          className={`mt-0.5 size-4 shrink-0 ${tone === "warning" ? "text-amber-600" : "text-destructive"}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">
                          Baris {row.lineNumber}: {row.input.companyName || "(tanpa nama)"}
                        </p>
                        {row.errors.map((message) => (
                          <p key={message} className="text-xs text-destructive">
                            {message}
                          </p>
                        ))}
                        {row.duplicateWith.length > 0 ? (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Duplikat dengan {row.duplicateWith.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={skipDuplicates}
                  onChange={(event) => setSkipDuplicates(event.target.checked)}
                />
                Lewati baris duplikat saat impor
              </label>
            </>
          ) : null}

          {result ? (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
              Selesai: {result.created} dibuat, {result.skippedDuplicates} duplikat
              dilewati, {result.skippedInvalid} tidak valid dilewati.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!preview || pending || preview.validCount === 0}
            onClick={() => void handleConfirm()}
          >
            {pending ? "Mengimpor..." : "Impor sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
