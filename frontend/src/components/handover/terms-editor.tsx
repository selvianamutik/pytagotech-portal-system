"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import {
  listTerms,
  replaceTerms,
  updateTermStatus,
  type TermsSummary,
} from "@/services/deal-terms";
import { formatCurrency } from "@/lib/utils";
import type { PaymentTermInput, TermStatus } from "@/types/deal";
import { TERM_STATUSES, termAmount } from "@/types/deal";

interface TermRow {
  key: number;
  id?: string;
  name: string;
  kind: "percent" | "amount";
  value: string;
  dueDate: string;
  milestone: string;
  status?: TermStatus;
}

const STATUS_STYLES: Record<TermStatus, string> = {
  "Belum Ditagih":
    "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  Ditagih:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Lunas:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

/**
 * Editor termin pembayaran (US-016): tambah banyak termin (% atau nominal,
 * tanggal/milestone), status per termin, total wajib = nilai deal.
 */
export function TermsEditor({ dealId, dealValue }: { dealId: string; dealValue: number }) {
  const [summary, setSummary] = useState<TermsSummary | null>(null);
  const [rows, setRows] = useState<TermRow[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listTerms(dealId).then(({ data }) => {
      if (cancelled || !data) {
        return;
      }
      setSummary(data);
      setRows(
        data.terms.map((term, index) => ({
          key: index,
          id: term.id,
          name: term.name,
          kind: term.kind,
          value: String(term.value),
          dueDate: term.dueDate ?? "",
          milestone: term.milestone ?? "",
          status: term.status,
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  function setRow(key: number, patch: Partial<TermRow>) {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  const liveTotal = rows.reduce((sum, row) => {
    const numeric = Number(row.value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return sum;
    }
    return sum + termAmount({ kind: row.kind, value: numeric }, dealValue);
  }, 0);
  const balanced = liveTotal === dealValue;

  async function handleSave() {
    setPending(true);
    setError(null);
    setNotice(null);
    const inputs: PaymentTermInput[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      value: Number(row.value),
      dueDate: row.dueDate || undefined,
      milestone: row.milestone || undefined,
    }));
    const { data, error: saveError } = await replaceTerms(dealId, inputs);
    setPending(false);
    if (saveError || !data) {
      setError(saveError ?? "Gagal menyimpan termin.");
      return;
    }
    setSummary(data);
    setRows(
      data.terms.map((term, index) => ({
        key: index,
        id: term.id,
        name: term.name,
        kind: term.kind,
        value: String(term.value),
        dueDate: term.dueDate ?? "",
        milestone: term.milestone ?? "",
        status: term.status,
      }))
    );
    setNotice("Termin tersimpan. Total sama dengan nilai deal.");
  }

  async function handleStatus(termId: string, status: TermStatus) {
    const { data, error: statusError } = await updateTermStatus(termId, status);
    if (statusError || !data) {
      setError(statusError ?? "Gagal mengubah status termin.");
      return;
    }
    setRows((previous) =>
      previous.map((row) => (row.id === termId ? { ...row, status } : row))
    );
  }

  if (!summary) {
    return <p className="text-sm text-muted-foreground">Memuat termin...</p>;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Termin pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${
            balanced
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          Total termin {formatCurrency(liveTotal)} dari nilai deal {formatCurrency(dealValue)}
          {balanced ? " — seimbang." : " — belum sama dengan nilai deal."}
        </p>

        {rows.map((row) => (
          <div key={row.key} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_130px_130px]">
            <Input
              aria-label="Nama termin"
              placeholder="DP 50%"
              value={row.name}
              onChange={(event) => setRow(row.key, { name: event.target.value })}
            />
            <div className="flex gap-2">
              <select
                aria-label="Jenis nilai termin"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={row.kind}
                onChange={(event) =>
                  setRow(row.key, { kind: event.target.value as "percent" | "amount" })
                }
              >
                <option value="percent">%</option>
                <option value="amount">Rp</option>
              </select>
              <Input
                aria-label="Nilai termin"
                type="number"
                min="0"
                value={row.value}
                onChange={(event) => setRow(row.key, { value: event.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Input
                aria-label="Tanggal jatuh tempo"
                type="date"
                value={row.dueDate}
                onChange={(event) => setRow(row.key, { dueDate: event.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus ${row.name || "termin"}`}
                disabled={rows.length <= 1}
                onClick={() =>
                  setRows((previous) => previous.filter((item) => item.key !== row.key))
                }
              >
                <MinusIcon aria-hidden="true" />
              </Button>
            </div>
            <Input
              aria-label="Milestone jatuh tempo"
              placeholder="Milestone (bila tanpa tanggal)"
              value={row.milestone}
              onChange={(event) => setRow(row.key, { milestone: event.target.value })}
              className="sm:col-span-2"
            />
            {row.id ? (
              <div className="flex items-center gap-2 sm:col-span-3">
                <Badge variant="outline" className={STATUS_STYLES[row.status ?? "Belum Ditagih"]}>
                  {row.status}
                </Badge>
                <FormSelect
                  id={`term-status-${row.id}`}
                  label="Status"
                  value={row.status ?? "Belum Ditagih"}
                  onChange={(value) => void handleStatus(row.id as string, value as TermStatus)}
                  options={TERM_STATUSES}
                />
              </div>
            ) : null}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((previous) => {
                const nextKey =
                  previous.reduce((max, row) => Math.max(max, row.key), -1) + 1;
                return [
                  ...previous,
                  { key: nextKey, name: "", kind: "percent", value: "", dueDate: "", milestone: "" },
                ];
              })
            }
          >
            <PlusIcon aria-hidden="true" /> Tambah termin
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={() => void handleSave()}>
            {pending ? "Menyimpan..." : "Simpan termin"}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            {notice}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
