"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRightIcon,
  CalendarClockIcon,
  MessageSquareIcon,
  UserPlusIcon,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  addLeadNote,
  getLeadTimeline,
  isFollowUpOverdue,
  type TimelineItem,
  type TimelineKind,
} from "@/services/lead-activities";
import { setNextFollowUp, updateLead } from "@/services/leads";
import { FormSelect } from "@/components/crm/lead-table";
import { useAuthStore } from "@/store/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

const kindIcons: Record<TimelineKind, typeof MessageSquareIcon> = {
  note: MessageSquareIcon,
  status: ArrowLeftRightIcon,
  stage: ArrowLeftRightIcon,
  assign: UserPlusIcon,
  followup: CalendarClockIcon,
};

/**
 * Dialog aktivitas per lead (US-012): timeline catatan + perubahan,
 * form catatan baru, dan penjadwalan follow-up berikutnya.
 */
export function LeadActivityDialog({
  lead,
  open,
  onOpenChange,
  onChanged,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const currentUser = useAuthStore((state) => state.user);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(lead.nextFollowUp ?? "");
  const [currentStatus, setCurrentStatus] = useState<Lead["status"]>(lead.status);
  const [newStatus, setNewStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getLeadTimeline(lead.id).then(({ data }) => {
      if (!cancelled) {
        setTimeline(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  function actor() {
    return {
      id: currentUser?.id ?? "USR-001",
      name: currentUser?.name ?? "Dinda Prameswari",
    };
  }

  async function refresh() {
    const { data } = await getLeadTimeline(lead.id);
    if (data) {
      setTimeline(data);
    }
    onChanged();
  }

  async function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: noteError } = await addLeadNote(lead.id, actor().id, note);
    setPending(false);
    if (noteError) {
      setError(noteError);
      return;
    }
    setNote("");
    await refresh();
  }

  async function handleFollowUp(event: React.FormEvent) {
    event.preventDefault();
    if (!followUp) {
      return;
    }
    setPending(true);
    setError(null);
    const { error: followUpError } = await setNextFollowUp(lead.id, followUp, actor());
    setPending(false);
    if (followUpError) {
      setError(followUpError);
      return;
    }
    await refresh();
  }

  async function handleStatusChange(event: React.FormEvent) {
    event.preventDefault();
    if (!newStatus) {
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: statusError } = await updateLead(
      lead.id,
      { status: newStatus as Lead["status"] },
      actor()
    );
    setPending(false);
    if (statusError || !data) {
      setError(statusError ?? "Gagal mengubah status.");
      return;
    }
    setCurrentStatus(data.status);
    setNewStatus("");
    await refresh();
  }

  const overdue = isFollowUpOverdue(lead.nextFollowUp, currentStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aktivitas · {lead.id}</DialogTitle>
          <DialogDescription>
            {lead.companyName} — riwayat komunikasi dan perubahan dengan penulis
            dan waktu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Follow-up berikutnya:</span>
            {lead.nextFollowUp ? (
              <Badge variant="outline">{formatDate(lead.nextFollowUp)}</Badge>
            ) : (
              <span className="text-muted-foreground">belum dijadwalkan</span>
            )}
            {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>

          <form onSubmit={handleStatusChange} className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{currentStatus}</span>
              </span>
              <div className="w-52">
                <FormSelect
                  id={`status-${lead.id}`}
                  label="Ubah ke status"
                  value={newStatus}
                  onChange={setNewStatus}
                  options={LEAD_STATUSES.filter((status) => status !== currentStatus)}
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={pending || !newStatus}>
              {pending ? "Menyimpan..." : "Ubah status"}
            </Button>
          </form>

          <form onSubmit={handleFollowUp} className="flex items-end gap-2">
            <div className="space-y-2">
              <label htmlFor={`followup-${lead.id}`} className="text-sm font-medium">
                Jadwalkan follow-up
              </label>
              <Input
                id={`followup-${lead.id}`}
                type="date"
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={pending || !followUp}>
              Simpan
            </Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat aktivitas...</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas untuk lead ini.
            </p>
          ) : (
            <ul className="max-h-64 space-y-4 overflow-y-auto">
              {timeline.map((item, index) => {
                const Icon = kindIcons[item.kind];
                return (
                  <li key={`${item.createdAt}-${index}`} className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{item.actorName}</span>{" "}
                        <span className="text-muted-foreground">{item.title}</span>
                      </p>
                      {item.detail ? (
                        <p className="mt-0.5 text-sm leading-6">{item.detail}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handleAddNote} className="space-y-2">
            <label htmlFor={`note-${lead.id}`} className="text-sm font-medium">
              Tambah catatan
            </label>
            <textarea
              id={`note-${lead.id}`}
              className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
              placeholder="Hasil telepon, janji demo, dsb."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={pending}
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" size="sm" disabled={pending || note.trim().length === 0}>
                {pending ? "Menyimpan..." : "Simpan catatan"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
