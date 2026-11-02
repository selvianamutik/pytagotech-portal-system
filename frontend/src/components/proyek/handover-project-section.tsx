"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/proyek/create-project-dialog";
import { canManageProjects, findProjectByHandover } from "@/services/projects";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/types/project";

/**
 * Bagian proyek pada detail handover (US-019): tombol "Buat Proyek"
 * untuk Dikonfirmasi + tautan dua arah setelah proyek lahir.
 */
export function HandoverProjectSection({
  handoverId,
  handoverStatus,
}: {
  handoverId: string;
  handoverStatus: string;
}) {
  const user = useAuthStore((state) => state.user);
  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const manageable = canManageProjects(user);

  useEffect(() => {
    let cancelled = false;
    void findProjectByHandover(handoverId).then((found) => {
      if (!cancelled) {
        setProject(found);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [handoverId]);

  // Seluruh seksi proyek disembunyikan untuk non-PM/Admin (permintaan pemilik).
  if (!manageable) {
    return null;
  }

  if (!loaded) {
    return null;
  }

  if (project) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Proyek tertaut</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              {project.id} · {project.pmName} · {formatCurrency(project.value)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" nativeButton={false} render={<Link href={`/proyek/${project.id}?from=${encodeURIComponent(`/handover/${handoverId}`)}`} />}>
            Buka proyek
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (handoverStatus !== "Dikonfirmasi") {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Proyek</CardTitle>
          <CardDescription>
            Tombol “Buat Proyek” muncul setelah handover Dikonfirmasi Produksi.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-end justify-between border-b">
          <div>
            <CardTitle className="text-base">Proyek</CardTitle>
            <CardDescription>Belum ada proyek dari handover ini.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon aria-hidden="true" /> Buat Proyek
          </Button>
        </CardHeader>
      </Card>
      {dialogOpen ? (
        <CreateProjectDialog
          handoverId={handoverId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </>
  );
}
