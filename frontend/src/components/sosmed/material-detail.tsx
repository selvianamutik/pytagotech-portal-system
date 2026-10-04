"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CircleCheckIcon, CircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMaterial } from "@/services/materials";
import {
  releaseMaterial,
  scheduleMaterial,
  setGateItem,
} from "@/services/quality-gate";
import { useAuthStore } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import type { ContentMaterial, QualityGateItem } from "@/types/material";
import { isQualityGateComplete, QUALITY_GATE_ITEMS } from "@/types/material";

/**
 * Detail materi: checklist quality gate, penjadwalan bergerbang,
 * dan rilis (US-029). Approval & revisi menyusul di US-030.
 */
export function MaterialDetail({ materialId }: { materialId: string }) {
  const user = useAuthStore((state) => state.user);
  const [material, setMaterial] = useState<ContentMaterial | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const actor = {
    name: user?.name ?? "Alya",
    roles: user?.roles ?? ["Social Media Specialist"],
  };
  const admin = actor.roles.includes("Super Admin");

  async function refresh() {
    const { data } = await getMaterial(materialId);
    if (data) {
      setMaterial(data);
    } else {
      setNotFound(true);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void getMaterial(materialId).then(({ data }) => {
      if (!cancelled) {
        if (data) {
          setMaterial(data);
        } else {
          setNotFound(true);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  async function handleToggle(item: QualityGateItem, checked: boolean) {
    const { error: toggleError } = await setGateItem(materialId, item, checked);
    if (toggleError) {
      setError(toggleError);
      return;
    }
    await refresh();
  }

  async function handleSchedule(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const { error: scheduleError } = await scheduleMaterial(
      materialId,
      { scheduleDate, releaseTime: releaseTime || undefined, overrideReason: overrideReason || undefined },
      actor
    );
    setPending(false);
    if (scheduleError) {
      setError(scheduleError);
      return;
    }
    setNotice("Materi dijadwalkan.");
    await refresh();
  }

  async function handleRelease() {
    setPending(true);
    setError(null);
    const { error: releaseError } = await releaseMaterial(materialId, actor, overrideReason || undefined);
    setPending(false);
    if (releaseError) {
      setError(releaseError);
      return;
    }
    setNotice("Materi dirilis.");
    await refresh();
  }

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Materi tidak ditemukan</CardTitle>
            <CardDescription>ID {materialId} tidak terdaftar.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!material) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat materi...</p>
      </main>
    );
  }

  const gateComplete = isQualityGateComplete(material.qualityGate);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <Button variant="outline" size="sm" render={<Link href="/sosmed/materi" />}>
        <ArrowLeftIcon aria-hidden="true" /> Database materi
      </Button>

      <div>
        <p className="font-mono text-xs text-muted-foreground">{material.id}</p>
        <h1 className="mt-1 text-2xl font-bold">{material.title}</h1>
        <div className="mt-2 flex gap-2">
          <Badge variant="outline">{material.brand}</Badge>
          <Badge variant="secondary">{material.status}</Badge>
          <Badge variant={gateComplete ? "default" : "outline"}>
            Gate {Object.values(material.qualityGate).filter(Boolean).length}/5
          </Badge>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Quality gate pra-rilis</CardTitle>
          <CardDescription>
            Materi tidak dapat dijadwalkan/dirilis bila belum lengkap — kecuali
            Admin beralasan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {QUALITY_GATE_ITEMS.map((item) => (
              <li key={item}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  {material.qualityGate[item] ? (
                    <CircleCheckIcon className="size-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <CircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={material.qualityGate[item]}
                    onChange={(event) => void handleToggle(item, event.target.checked)}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          {material.gateOverride ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Pengecualian oleh {material.gateOverride.by}: {material.gateOverride.reason}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Jadwal & rilis</CardTitle>
          <CardDescription>
            Saat ini: {material.scheduleDate ? formatDate(material.scheduleDate) : "belum dijadwalkan"}
            {material.releaseTime ? ` ${material.releaseTime}` : ""}. Penjadwalan butuh
            status Disetujui (US-030).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSchedule} className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <label htmlFor={`sched-${material.id}`} className="text-sm font-medium">
                Jadwal tayang
              </label>
              <Input
                id={`sched-${material.id}`}
                type="date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`time-${material.id}`} className="text-sm font-medium">
                Jam rilis
              </label>
              <Input
                id={`time-${material.id}`}
                type="time"
                value={releaseTime}
                onChange={(event) => setReleaseTime(event.target.value)}
              />
            </div>
            {admin && !gateComplete ? (
              <div className="space-y-2">
                <label htmlFor={`reason-${material.id}`} className="text-sm font-medium">
                  Alasan pengecualian (Admin)
                </label>
                <Input
                  id={`reason-${material.id}`}
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                />
              </div>
            ) : null}
            <Button type="submit" size="sm" disabled={pending || !scheduleDate}>
              {pending ? "Menyimpan..." : "Jadwalkan"}
            </Button>
            {material.status === "Dijadwalkan" ? (
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void handleRelease()}>
                Rilis sekarang
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
