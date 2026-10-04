"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { listRevisions, submitReview } from "@/services/approvals";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/lib/utils";
import type { MaterialRevision } from "@/types/material";
import { APPROVAL_DECISIONS } from "@/types/material";

const DECISION_STYLES: Record<string, string> = {
  "Disetujui Tanpa Revisi":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  "Disetujui dengan Revisi Minor":
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  Ditolak:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

/**
 * Alur approval & riwayat revisi materi (US-030): versi Rev 0, 1, ...
 * dengan reviewer, keputusan, umpan balik, dan bukti revisi.
 */
export function ApprovalSection({
  materialId,
  onChanged,
}: {
  materialId: string;
  onChanged: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [revisions, setRevisions] = useState<MaterialRevision[]>([]);
  const [decision, setDecision] = useState<string>(APPROVAL_DECISIONS[0]);
  const [feedback, setFeedback] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listRevisions(materialId);
    if (data) {
      setRevisions(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listRevisions(materialId).then(({ data }) => {
      if (!cancelled && data) {
        setRevisions(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: reviewError } = await submitReview(materialId, {
      decision,
      reviewer: user?.name ?? "Leader",
      feedback,
      evidenceLink,
    });
    setPending(false);
    if (reviewError) {
      setError(reviewError);
      return;
    }
    setFeedback("");
    setEvidenceLink("");
    await refresh();
    onChanged();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Approval & riwayat revisi</CardTitle>
        <CardDescription>
          Materi hanya bisa dijadwalkan setelah berstatus Disetujui.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada review. Materi baru berada pada Rev 0 (Draf awal).
          </p>
        ) : (
          <ul className="space-y-3">
            {revisions.map((revision) => (
              <li key={revision.version} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    Rev {revision.version}
                  </Badge>
                  <Badge variant="outline" className={DECISION_STYLES[revision.decision]}>
                    {revision.decision}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-medium">{revision.reviewer}</span>
                  {revision.feedback ? (
                    <span className="text-muted-foreground"> — {revision.feedback}</span>
                  ) : null}
                </p>
                {revision.evidenceLink ? (
                  <p className="text-xs text-muted-foreground">
                    Bukti: <span className="font-mono">{revision.evidenceLink}</span>
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(revision.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3">
          <FormSelect
            id={`review-decision-${materialId}`}
            label="Keputusan"
            value={decision}
            onChange={setDecision}
            options={APPROVAL_DECISIONS}
          />
          <div className="space-y-2">
            <label htmlFor={`review-feedback-${materialId}`} className="text-sm font-medium">
              Umpan balik {decision === "Ditolak" ? "(wajib)" : "(opsional)"}
            </label>
            <textarea
              id={`review-feedback-${materialId}`}
              className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`review-evidence-${materialId}`} className="text-sm font-medium">
              Link bukti penyelesaian revisi (opsional)
            </label>
            <Input
              id={`review-evidence-${materialId}`}
              placeholder="https://..."
              value={evidenceLink}
              onChange={(event) => setEvidenceLink(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Menyimpan..." : "Kirim review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
