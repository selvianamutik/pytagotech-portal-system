"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { INDUSTRY_CATEGORIES, LEAD_STATUSES } from "@/types/lead";

export interface LeadFilterState {
  search: string;
  status: string;
  picName: string;
  industry: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_LEAD_FILTERS: LeadFilterState = {
  search: "",
  status: "",
  picName: "",
  industry: "",
  dateFrom: "",
  dateTo: "",
};

interface LeadFiltersProps {
  filters: LeadFilterState;
  onChange: (filters: LeadFilterState) => void;
  picNames: string[];
  resultCount: number;
}

/** Bilah filter multi-kriteria database lead (US-008). */
export function LeadFilters({ filters, onChange, picNames, resultCount }: LeadFiltersProps) {
  function set(patch: Partial<LeadFilterState>) {
    onChange({ ...filters, ...patch });
  }

  const isActive =
    filters.search !== "" ||
    filters.status !== "" ||
    filters.picName !== "" ||
    filters.industry !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="lead-search" className="text-sm font-medium">
            Pencarian
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="lead-search"
              placeholder="Perusahaan, email, WA, IG..."
              className="pl-8"
              value={filters.search}
              onChange={(event) => set({ search: event.target.value })}
            />
          </div>
        </div>
        <FormSelect
          id="filter-status"
          label="Status"
          value={filters.status}
          onChange={(value) => set({ status: value })}
          options={LEAD_STATUSES}
        />
        <FormSelect
          id="filter-pic"
          label="PIC"
          value={filters.picName}
          onChange={(value) => set({ picName: value })}
          options={picNames}
        />
        <FormSelect
          id="filter-industry"
          label="Kategori industri"
          value={filters.industry}
          onChange={(value) => set({ industry: value })}
          options={INDUSTRY_CATEGORIES}
        />
        <div className="space-y-2">
          <label htmlFor="filter-date-from" className="text-sm font-medium">
            Hubungi dari
          </label>
          <Input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => set({ dateFrom: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="filter-date-to" className="text-sm font-medium">
            Hubungi sampai
          </label>
          <Input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => set({ dateTo: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" role="status">
          {resultCount} lead ditemukan
        </p>
        {isActive ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(EMPTY_LEAD_FILTERS)}>
            Reset filter
          </Button>
        ) : null}
      </div>
    </div>
  );
}
