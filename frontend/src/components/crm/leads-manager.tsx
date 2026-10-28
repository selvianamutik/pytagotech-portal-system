"use client";

import { useEffect, useState } from "react";
import { PlusIcon, TriangleAlertIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadFilters, EMPTY_LEAD_FILTERS, type LeadFilterState } from "@/components/crm/lead-filters";
import { ImportLeadsDialog } from "@/components/crm/import-leads-dialog";
import { LeadActivityDialog } from "@/components/crm/lead-activity-dialog";
import { LeadForm } from "@/components/crm/lead-form";
import { LeadTable } from "@/components/crm/lead-table";
import { FormSelect } from "@/components/crm/lead-table";
import {
  assignLeadPIC,
  listLeadPICs,
  queryLeads,
  type LeadSortKey,
  type SortDirection,
} from "@/services/leads";
import { useAuthStore } from "@/store/auth";
import type { Lead } from "@/types/lead";
import { isLeadStatus } from "@/types/lead";

/**
 * Halaman database lead (US-007 + US-008): tabel + form tambah/ubah,
 * filter multi-kriteria, sort per kolom, paginasi, peringatan duplikat.
 */
export function LeadsManager() {
  const currentUser = useAuthStore((state) => state.user);
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
  const [importOpen, setImportOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState<Lead | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPic, setBulkPic] = useState("");
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

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
      industries: filters.industry ? [filters.industry] : undefined,
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

  function toggleSelect(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selected) => selected !== id)
        : [...previous, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds((previous) => {
      const visibleIds = leads.map((lead) => lead.id);
      const allSelected = visibleIds.every((id) => previous.includes(id));
      if (allSelected) {
        return previous.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...previous, ...visibleIds])];
    });
  }

  async function handleBulkAssign() {
    if (selectedIds.length === 0 || !bulkPic) {
      return;
    }
    setBulkPending(true);
    setBulkError(null);
    const { error } = await assignLeadPIC(selectedIds, bulkPic, {
      id: currentUser?.id ?? "USR-001",
      name: currentUser?.name ?? "Dinda Prameswari",
    });
    setBulkPending(false);
    if (error) {
      setBulkError(error);
      return;
    }
    setSelectedIds([]);
    setBulkPic("");
    await refresh();
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
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
            <UploadIcon aria-hidden="true" /> Impor CSV
          </Button>
          <Button type="button" onClick={openCreate}>
            <PlusIcon aria-hidden="true" /> Tambah lead
          </Button>
        </div>
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
          {selectedIds.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-muted/50 p-3 sm:flex-row sm:items-end">
              <p className="text-sm font-medium sm:pb-2" role="status">
                {selectedIds.length} lead dipilih
              </p>
              <div className="w-full sm:max-w-64">
                <FormSelect
                  id="bulk-pic"
                  label="PIC baru"
                  value={bulkPic}
                  onChange={setBulkPic}
                  options={picNames}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!bulkPic || bulkPending}
                  onClick={() => void handleBulkAssign()}
                >
                  {bulkPending ? "Menerapkan..." : "Terapkan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedIds([]);
                    setBulkPic("");
                    setBulkError(null);
                  }}
                >
                  Batal
                </Button>
              </div>
              {bulkError ? (
                <p role="alert" className="text-sm text-destructive sm:pb-2">
                  {bulkError}
                </p>
              ) : null}
            </div>
          ) : null}
          <LeadTable
            leads={leads}
            onEdit={openEdit}
            onActivity={(lead) => setActivityTarget(lead)}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
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

      {importOpen ? (
        <ImportLeadsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={() => void refresh()}
        />
      ) : null}

      {activityTarget ? (
        <LeadActivityDialog
          key={`activity-${activityTarget.id}`}
          lead={activityTarget}
          open={activityTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setActivityTarget(null);
            }
          }}
          onChanged={() => void refresh()}
        />
      ) : null}

      {dialogOpen ? (
        <LeadForm
          key={editTarget ? `edit-${editTarget.id}` : "create"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editTarget}
          picNames={picNames}
          actor={
            currentUser ? { id: currentUser.id, name: currentUser.name } : undefined
          }
          onSaved={(saveWarning) => {
            setWarning(saveWarning);
            void refresh();
          }}
        />
      ) : null}
    </main>
  );
}
