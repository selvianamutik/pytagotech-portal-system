"use client";

import { useEffect, useState } from "react";
import { PlusIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadFilters, EMPTY_LEAD_FILTERS, type LeadFilterState } from "@/components/crm/lead-filters";
import { LeadForm } from "@/components/crm/lead-form";
import { LeadTable } from "@/components/crm/lead-table";
import {
  listLeadPICs,
  queryLeads,
  type LeadSortKey,
  type SortDirection,
} from "@/services/leads";
import type { Lead } from "@/types/lead";
import { isIndustryCategory, isLeadStatus } from "@/types/lead";

/**
 * Halaman database lead (US-007 + US-008): tabel + form tambah/ubah,
 * filter multi-kriteria, sort per kolom, paginasi, peringatan duplikat.
 */
export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [picNames, setPicNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [filters, setFilters] = useState<LeadFilterState>(EMPTY_LEAD_FILTERS);
  const [sortBy, setSortBy] = useState<LeadSortKey>("contactDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listLeadPICs().then((picsResult) => {
      if (!cancelled) {
        setPicNames((picsResult.data ?? []).map((pic) => pic.name));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void queryLeads({
      search: filters.search || undefined,
      statuses: filters.status && isLeadStatus(filters.status) ? [filters.status] : undefined,
      picNames: filters.picName ? [filters.picName] : undefined,
      industries: filters.industry && isIndustryCategory(filters.industry) ? [filters.industry] : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy,
      sortDir,
      page,
    }).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.error || !result.data) {
        setLoadError(result.error ?? "Gagal memuat lead.");
      } else {
        setLeads(result.data.items);
        setTotal(result.data.total);
        setPage(result.data.page);
        setPageCount(result.data.pageCount);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filters, sortBy, sortDir, page]);

  /** Query ulang halaman aktif (dipakai setelah tambah/ubah). */
  async function refresh() {
    const { data } = await queryLeads({
      search: filters.search || undefined,
      sortBy,
      sortDir,
      page,
    });
    if (data) {
      setLeads(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageCount(data.pageCount);
    }
  }

  function handleFiltersChange(next: LeadFilterState) {
    setFilters(next);
    setPage(1);
  }

  function handleSort(key: LeadSortKey) {
    if (key === sortBy) {
      setSortDir((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function openCreate() {
    setEditTarget(null);
    setWarning(null);
    setDialogOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setWarning(null);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat database lead...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Database lead belum tersedia</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => window.location.reload()}>
              Muat ulang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">CRM · Marketing</p>
          <h1 className="mt-1 text-2xl font-bold">Database Lead</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} prospek tersimpan terpusat. Nomor WhatsApp dan nama
            perusahaan diperiksa duplikat otomatis.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" /> Tambah lead
        </Button>
      </div>

      {warning ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      ) : null}

      <LeadFilters
        filters={filters}
        onChange={handleFiltersChange}
        picNames={picNames}
        resultCount={total}
      />

      {leads.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tidak ada lead yang cocok dengan filter. Ubah filter atau tambahkan
              lead baru.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <LeadTable
            leads={leads}
            onEdit={openEdit}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" role="status">
              Halaman {page} dari {pageCount} · {total} lead
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((previous) => previous - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((previous) => previous + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}

      {dialogOpen ? (
        <LeadForm
          key={editTarget ? `edit-${editTarget.id}` : "create"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editTarget}
          picNames={picNames}
          onSaved={(saveWarning) => {
            setWarning(saveWarning);
            void refresh();
          }}
        />
      ) : null}
    </main>
  );
}
