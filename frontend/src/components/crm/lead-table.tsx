"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/lead";

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  Contacted:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  "Follow Up":
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Interest:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  "Not Interested":
    "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  Lost: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  Closing:
    "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300",
};

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

/** Tabel database lead dengan badge status berwarna (US-007, US-008). */
export function LeadTable({ leads, onEdit }: LeadTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-4">ID</TableHead>
              <TableHead>Perusahaan / Brand</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>PIC</TableHead>
              <TableHead>Tgl Hubungi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                  {lead.id}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{lead.companyName}</p>
                  <p className="text-xs text-muted-foreground">{lead.industry}</p>
                </TableCell>
                <TableCell>
                  <p className="font-mono text-xs">{lead.whatsapp}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                  {lead.instagram ? (
                    <p className="text-xs text-muted-foreground">{lead.instagram}</p>
                  ) : null}
                </TableCell>
                <TableCell>{lead.picName}</TableCell>
                <TableCell>{formatDate(lead.contactDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_STYLES[lead.status]}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(lead)}
                  >
                    Ubah
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Select native se gaya Input shadcn (US-007). */
export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="" disabled>
          Pilih {label.toLowerCase()}...
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
