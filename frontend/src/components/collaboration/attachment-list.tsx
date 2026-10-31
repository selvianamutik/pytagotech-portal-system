"use client";

import { useEffect, useState } from "react";
import { FileIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteAttachment,
  getAttachmentSizeLimit,
  listAttachments,
  uploadAttachment,
} from "@/services/collaboration";
import { useAuthStore } from "@/store/auth";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import type {
  AttachmentItem,
  CollaborableEntityType,
} from "@/types/collaboration";
import { ENTITY_TYPE_LABELS } from "@/types/collaboration";

interface AttachmentListProps {
  entityType: CollaborableEntityType;
  entityId: string;
}

/**
 * Daftar + unggah lampiran reusable (US-006).
 * Batas ukuran dari `NEXT_PUBLIC_MAX_ATTACHMENT_SIZE_BYTES`.
 */
export function AttachmentList({ entityType, entityId }: AttachmentListProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = getAttachmentSizeLimit();

  useEffect(() => {
    let cancelled = false;
    void listAttachments(entityType, entityId).then(({ data }) => {
      if (cancelled) {
        return;
      }
      setAttachments(data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!currentUser) {
      setError("Masuk untuk mengunggah file.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: uploadError } = await uploadAttachment({
      entityType,
      entityId,
      file,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
    });
    setPending(false);
    if (uploadError || !data) {
      setError(uploadError ?? "Gagal mengunggah file.");
      return;
    }
    setAttachments((previous) => [...previous, data]);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await deleteAttachment(id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setAttachments((previous) => previous.filter((item) => item.id !== id));
  }

  const inputId = `lampiran-${entityType}-${entityId}`;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">
          Lampiran · {ENTITY_TYPE_LABELS[entityType]} {entityId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat lampiran...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada lampiran untuk entitas ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSizeBytes)} · {attachment.uploadedByName} ·{" "}
                    {formatDateTime(attachment.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus ${attachment.fileName}`}
                  title="Hapus lampiran"
                  onClick={() => void handleDelete(attachment.id)}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div>
          <input
            id={inputId}
            type="file"
            className="sr-only"
            disabled={pending}
            onChange={(event) => void handleFileChange(event)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            nativeButton={false}
            render={
              <label htmlFor={inputId} className="cursor-pointer" />
            }
          >
            <UploadIcon aria-hidden="true" />
            {pending ? "Mengunggah..." : "Unggah file"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Maksimal {formatFileSize(limit)} per file.
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
