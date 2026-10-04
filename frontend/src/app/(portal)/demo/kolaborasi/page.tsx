import type { Metadata } from "next";
import Link from "next/link";

import { AttachmentList } from "@/components/collaboration/attachment-list";
import { CommentSection } from "@/components/collaboration/comment-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Demo Kolaborasi — Pytagotech Portal",
  description:
    "Verifikasi komponen komentar, lampiran, dan notifikasi reusable di empat tipe entitas (US-006).",
};

const demoHosts = [
  { type: "lead", id: "LEAD-024", title: "Follow up PT Aruna Digital" },
  { type: "task", id: "TSK-118", title: "Review desain landing Pytabelajar" },
  { type: "fitur", id: "FIT-011", title: "Login SSO (contoh fitur)" },
  { type: "konten", id: "MAT-0018", title: "Carousel edukasi API" },
] as const;

/**
 * Galeri verifikasi US-006 (Fase 1): membuktikan komponen yang sama
 * dapat dipasang pada lead, task, fitur, dan konten.
 * Dihapus/diganti host asli (lead/task/konten) saat modul terkait selesai.
 */
export default function CollaborationDemoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">US-006 · Demo verifikasi Fase 1</p>
          <h1 className="mt-1 text-2xl font-bold">Kolaborasi reusable</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Komponen komentar dan lampiran yang sama dipasang pada empat tipe
            entitas. Coba tulis komentar dengan @mention (mis.{" "}
            <span className="font-mono">@Nabila</span>), unggah file, lalu cek
            bell notifikasi atau halaman notifikasi.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/notifikasi" />}>
          Buka notifikasi
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {demoHosts.map((host) => (
          <div key={`${host.type}-${host.id}`} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{host.title}</h2>
              <p className="font-mono text-xs text-muted-foreground">{host.id}</p>
            </div>
            <CommentSection entityType={host.type} entityId={host.id} />
            <AttachmentList entityType={host.type} entityId={host.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
