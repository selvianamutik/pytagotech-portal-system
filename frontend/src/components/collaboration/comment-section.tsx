"use client";

import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addComment, listComments } from "@/services/collaboration";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/lib/utils";
import type {
  CollaborableEntityType,
  CommentItem,
} from "@/types/collaboration";
import { ENTITY_TYPE_LABELS } from "@/types/collaboration";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Highlight token `@Nama` di isi komentar. */
export function renderCommentBody(body: string) {
  return body.split(/(@[A-Za-z][\w.]*)/g).map((part, index) =>
    part.startsWith("@") ? (
      <span key={index} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

interface CommentSectionProps {
  entityType: CollaborableEntityType;
  entityId: string;
}

/**
 * Bagian komentar reusable (US-006): dipasang pada lead, task, fitur,
 * dan konten hanya dengan mengganti `entityType` + `entityId`.
 */
export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listComments(entityType, entityId).then(({ data }) => {
      if (cancelled) {
        return;
      }
      setComments(data ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUser) {
      setError("Masuk untuk menulis komentar.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: submitError } = await addComment({
      entityType,
      entityId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      body: draft,
    });
    setPending(false);
    if (submitError || !data) {
      setError(submitError ?? "Gagal mengirim komentar.");
      return;
    }
    setComments((previous) => [...previous, data]);
    setDraft("");
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">
          Komentar · {ENTITY_TYPE_LABELS[entityType]} {entityId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat komentar...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada komentar. Mulai diskusi pertama di bawah.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{comment.authorName}</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm leading-6">
                    {renderCommentBody(comment.body)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor={`komentar-${entityType}-${entityId}`} className="sr-only">
            Tulis komentar
          </label>
          <textarea
            id={`komentar-${entityType}-${entityId}`}
            className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring"
            placeholder="Tulis komentar... sebut rekan dengan @Nama"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={pending}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending || draft.trim().length === 0}>
            {pending ? "Mengirim..." : "Kirim komentar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
